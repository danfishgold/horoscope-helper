port module Main exposing (..)

import Platform exposing (program)
import Dict exposing (Dict)
import Sign exposing (Sign)
import Message exposing (Message(..))
import Horoscope exposing (Horoscope)
import Upload
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
    | ErrorUploadingHoroscope Horoscope String


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
    case msg of
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
    in
        ( { model | conversations = Dict.insert chatId newConvo model.conversations }
        , cmd
        )


setState : State -> Conversation -> Conversation
setState newState convo =
    { convo | state = newState }


onText : String -> Int -> Conversation -> ( Conversation, Cmd Msg )
onText text chatId convo =
    case convo.state of
        Initial ->
            ( convo |> setState ImageInput, Message.send chatId <| Text "TODO" )

        _ ->
            ( convo, Message.send chatId <| Text "TODO" )


onPhoto : String -> Int -> Conversation -> ( Conversation, Cmd Msg )
onPhoto photoId chatId convo =
    case convo.state of
        Initial ->
            ( { convo | photoIds = photoId :: convo.photoIds }
                |> setState ImageInput
            , Cmd.none
            )

        ImageInput ->
            ( { convo | photoIds = photoId :: convo.photoIds }, Cmd.none )

        _ ->
            ( { convo | photoIds = photoId :: convo.photoIds }
            , Message.send chatId <| Text "נטפל בתמונה הזאת אחר כך. אנחנו באמצע משהו"
            )


onUploadFinished : Result String () -> Int -> Conversation -> ( Conversation, Cmd Msg )
onUploadFinished result chatId convo =
    case result of
        Ok () ->
            ( convo, Message.send chatId <| Text "זהו. מה עכשיו?" )

        Err error ->
            ( convo, Message.send chatId <| Text <| "אוי לא. משהו רע קרה:\n" ++ error )
