port module Main exposing (..)

import Platform exposing (program)
import Dict exposing (Dict)
import Sign exposing (Sign)
import Message exposing (Message(..))
import Horoscope exposing (Horoscope)
import Upload
import Time exposing (second)
import Json.Decode


type alias Model =
    { conversations : Dict Int Conversation }


type alias Conversation =
    { state : State
    , photoIds : List String
    }


initialConversation : Conversation
initialConversation =
    { state = Initial
    , photoIds = []
    }


type State
    = Initial
    | ImageInput
    | ContentInput { photoId : String }
    | SignInput { photoId : String, content : String }
    | CensorInput { photoId : String, content : String, sign : Sign }
    | UploadingHoroscope Horoscope


type Msg
    = NewMessage Int Message
    | DoneUploading Int (Result String ())


main : Program Never Model Msg
main =
    program
        { init = init
        , subscriptions = subscriptions
        , update = update
        }


init : ( Model, Cmd Msg )
init =
    ( { conversations = Dict.empty }, Cmd.none )


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.batch
        [ Message.sub NewMessage
        , Upload.uploadResult DoneUploading
        ]


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case Debug.log "msg" msg of
        NewMessage chatId (Text text) ->
            mapConversation (onText text) chatId model

        NewMessage chatId (Photo photoId) ->
            mapConversation (onPhoto photoId) chatId model

        DoneUploading chatId result ->
            mapConversation (onUploadFinished result) chatId model


mapConversation : (Int -> Conversation -> ( Conversation, Cmd Msg )) -> Int -> Model -> ( Model, Cmd Msg )
mapConversation fn chatId model =
    let
        convo =
            Dict.get chatId model.conversations
                |> Maybe.withDefault initialConversation

        ( newConvo, cmd ) =
            fn chatId convo

        _ =
            Debug.log "(old state, new state)" ( convo.state, newConvo.state )
    in
        ( { model | conversations = Dict.insert chatId newConvo model.conversations }
        , cmd
        )


setState : State -> Conversation -> Conversation
setState newState convo =
    { convo | state = newState }


addPhotoToQueue : String -> Conversation -> Conversation
addPhotoToQueue photoId convo =
    { convo | photoIds = convo.photoIds ++ [ photoId ] }


onText : String -> Int -> Conversation -> ( Conversation, Cmd Msg )
onText text chatId convo =
    case convo.state of
        Initial ->
            ( convo |> setState ImageInput, Message.text chatId "היוש. תשלח/י לי תמונות כאוות נפשך. כשימאס לך תשלח/י לי ״זהו״ ואז נטפל בהן יפה יפה אחת אחת" )

        ImageInput ->
            if text == "זהו" then
                case convo.photoIds of
                    [] ->
                        ( convo, Message.text chatId "מה זהו? לא שלחת לי תמונות" )

                    nextPhoto :: otherPhotos ->
                        ( { convo | photoIds = otherPhotos }
                            |> setState (ContentInput { photoId = nextPhoto })
                        , Message.batch (0.1 * second)
                            chatId
                            [ Text "נתחיל מזה:"
                            , Photo nextPhoto
                            , Text "מה כתוב?"
                            ]
                        )
            else
                ( convo, Message.text chatId "כשימאס לך להזין תמונות תכתוב ״זהו״ ואז אני אדע להתחיל לתחקר אותך על התוכן של כל תמונה" )

        ContentInput { photoId } ->
            ( convo |> setState (SignInput { photoId = photoId, content = text })
            , Message.text chatId "מה המזל?"
            )

        SignInput { photoId, content } ->
            case Sign.fromString text of
                Nothing ->
                    ( convo, Message.text chatId "לא הבנתי איזה מזל זה" )

                Just sign ->
                    ( convo |> setState (CensorInput { photoId = photoId, content = content, sign = sign })
                    , Message.text chatId "מי צנזר?"
                    )

        CensorInput { photoId, content, sign } ->
            let
                horoscope =
                    { photoId = photoId, content = content, sign = sign, censor = text }
            in
                ( convo |> setState (UploadingHoroscope horoscope)
                , Cmd.batch
                    [ Message.text chatId "נייס. אני אעלה את הצנזור"
                    , Upload.upload chatId horoscope
                    ]
                )

        UploadingHoroscope _ ->
            ( convo, Message.text chatId "רגע, אני עוד מעלה" )


onPhoto : String -> Int -> Conversation -> ( Conversation, Cmd Msg )
onPhoto photoId chatId convo =
    case convo.state of
        Initial ->
            ( convo
                |> addPhotoToQueue photoId
                |> setState ImageInput
            , Cmd.none
            )

        ImageInput ->
            ( convo |> addPhotoToQueue photoId, Cmd.none )

        _ ->
            ( convo |> addPhotoToQueue photoId
            , Message.text chatId "נטפל בתמונה הזאת אחר כך. אנחנו באמצע משהו"
            )


onUploadFinished : Result String () -> Int -> Conversation -> ( Conversation, Cmd Msg )
onUploadFinished result chatId convo =
    case result of
        Ok () ->
            case convo.photoIds of
                [] ->
                    ( convo |> setState ImageInput
                    , Message.text chatId "זהו. רוצה להעלות עוד תמונות?"
                    )

                nextPhoto :: otherPhotos ->
                    ( { convo | photoIds = otherPhotos }
                        |> setState (ContentInput { photoId = nextPhoto })
                    , Message.batch (0.1 * second)
                        chatId
                        [ Text "בוצע."
                        , Photo nextPhoto
                        , Text "מה כתוב בצנזור הזה?"
                        ]
                    )

        Err error ->
            ( { convo | photoIds = [] } |> setState ImageInput
            , Message.batch (0.2 * second)
                chatId
                [ Text "אוי לא. משהו רע קרה"
                , Text error
                , Text "דן ישמח לצילום מסך. בינתיים אני אשכח את כל מה שקרה ושתכננו לעשות ונתחיל מההתחלה."
                , Text "כלומר זה הזמן להעלות תמונות"
                ]
            )
