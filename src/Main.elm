port module Main exposing (..)

import Platform exposing (program)
import EveryDict as Dict exposing (EveryDict)
import ChatId exposing (ChatId)
import Sign exposing (Sign)
import Message exposing (Message(..))
import Horoscope exposing (Horoscope)
import Upload
import Time exposing (second)
import Json.Decode


type alias Model =
    { conversations : EveryDict ChatId Conversation }


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
    | WaitingForTable


type Msg
    = NewMessage ChatId Message
    | DoneUploading ChatId (Result String ())
    | OnRatings ChatId (List ( Sign, Float ))


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
        , Sign.onRatings OnRatings
        ]


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        NewMessage chatId (Text "/next") ->
            ( model, Sign.getRatings chatId )

        NewMessage chatId (Text text) ->
            mapConversation (onText text) chatId model

        NewMessage chatId (TextWithKeyboard text _) ->
            mapConversation (onText text) chatId model

        NewMessage chatId (Photo photoId) ->
            mapConversation (onPhoto photoId) chatId model

        DoneUploading chatId result ->
            mapConversation (onUploadFinished result) chatId model

        OnRatings chatId ratings ->
            mapConversation (onRatings ratings) chatId model


mapConversation : (ChatId -> Conversation -> ( Conversation, Cmd Msg )) -> ChatId -> Model -> ( Model, Cmd Msg )
mapConversation fn chatId model =
    let
        convo =
            Dict.get chatId model.conversations
                |> Maybe.withDefault initialConversation

        ( newConvo, cmd ) =
            fn chatId convo
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


onText : String -> ChatId -> Conversation -> ( Conversation, Cmd Msg )
onText text chatId convo =
    case convo.state of
        Initial ->
            ( convo |> setState ImageInput, Message.text chatId "היוש. תשלח/י לי תמונות כאוות נפשך. כשימאס לך תשלח/י לי ״זהו״ ואז נטפל בהן יפה יפה אחת אחת" )

        ImageInput ->
            if text == "זהו" then
                case convo.photoIds of
                    [] ->
                        ( convo, Message.text chatId "מה זהו? לא שלחת לי תמונות" )

                    [ aSinglePhoto ] ->
                        ( { convo | photoIds = [] }
                            |> setState (ContentInput { photoId = aSinglePhoto })
                        , Message.text chatId "מה כתוב?"
                        )

                    nextPhoto :: otherPhotos ->
                        ( { convo | photoIds = otherPhotos }
                            |> setState (ContentInput { photoId = nextPhoto })
                        , Message.batch (0.3 * second)
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
            , Message.send chatId <| TextWithKeyboard "מה המזל?" Sign.keyboard
            )

        SignInput { photoId, content } ->
            case Sign.fromString text of
                Nothing ->
                    ( convo
                    , Message.send chatId <|
                        TextWithKeyboard "לא הבנתי איזה מזל זה" Sign.keyboard
                    )

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

        WaitingForTable ->
            ( convo, Message.text chatId "שניונת" )


onPhoto : String -> ChatId -> Conversation -> ( Conversation, Cmd Msg )
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


onUploadFinished : Result String () -> ChatId -> Conversation -> ( Conversation, Cmd Msg )
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


onRatings : List ( Sign, Float ) -> ChatId -> Conversation -> ( Conversation, Cmd msg )
onRatings ratings chatId convo =
    let
        topThree =
            ratings
                |> List.sortBy Tuple.second
                |> List.take 3
                |> List.map (\( sign, rating ) -> Sign.toString sign ++ ": " ++ toString (round 3 rating))
                |> String.join "\n"

        text =
            "המזלות הבאים שכדאי להעלות:\n" ++ topThree
    in
        ( convo, Message.text chatId text )


round : Int -> Float -> Float
round digits number =
    (toFloat <| Basics.round <| number * (10 ^ toFloat digits)) * (10 ^ toFloat -digits)
