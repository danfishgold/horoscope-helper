module Main exposing (..)

import Platform exposing (program)
import Dict exposing (Dict)
import Sign exposing (Sign)
import Message exposing (Message)
import Json.Decode


type alias Model =
    { conversations : Dict Int Conversation }


type alias Conversation =
    { state : State
    , fileIds : List String
    }


initialConversation : Conversation
initialConversation =
    { state = ImageInput
    , fileIds = []
    }


type State
    = ImageInput
    | ContentInput { photoId : String }
    | SignInput { photoId : String, content : String }
    | CensorInput { photoId : String, content : String, sign : Sign }
    | UploadingHoroscope Horoscope
    | ErrorUploadingHoroscope Horoscope String


type alias Horoscope =
    { imageId : String
    , content : String
    , sign : Sign
    , censor : String
    }


type Msg
    = NewMessage Message


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
    Message.sub NewMessage


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        NewMessage { chatId, content } ->
            let
                convo =
                    Dict.get chatId model.conversations
                        |> Maybe.withDefault initialConversation

                ( newConvo, maybeContent, cmd ) =
                    case content of
                        Message.Text text ->
                            onText text convo

                        Message.Photo photoId ->
                            onPhoto photoId convo

                messageCommand =
                    maybeContent
                        |> Maybe.map (Message chatId)
                        |> Maybe.map Message.send
                        |> Maybe.withDefault Cmd.none
            in
                ( { model | conversations = Dict.insert chatId newConvo model.conversations }
                , Cmd.batch [ cmd, messageCommand ]
                )


onText : String -> Conversation -> ( Conversation, Maybe Message.Content, Cmd Msg )
onText text conversation =
    case conversation.state of
        _ ->
            ( conversation, Just <| Message.Text text, Cmd.none )


onPhoto : String -> Conversation -> ( Conversation, Maybe Message.Content, Cmd Msg )
onPhoto photoId conversation =
    case conversation.state of
        _ ->
            ( conversation, Just <| Message.Photo photoId, Cmd.none )
