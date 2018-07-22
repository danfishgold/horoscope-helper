port module Message exposing (Message(..), sub, send, text, batch)

import Time exposing (Time)
import ChatId exposing (ChatId)
import Json.Encode exposing (Value)


type Message
    = Text String
    | TextWithKeyboard String (List (List String))
    | Photo String


sub : (ChatId -> Message -> msg) -> Sub msg
sub onMessage =
    Sub.batch
        [ onText (\( chatId, text ) -> onMessage (ChatId.decode chatId) (Text text))
        , onPhoto (\( chatId, photoId ) -> onMessage (ChatId.decode chatId) (Photo photoId))
        ]


send : ChatId -> Message -> Cmd msg
send =
    delayed 0


text : ChatId -> String -> Cmd msg
text chatId text =
    send chatId (Text text)


delayed : Time -> ChatId -> Message -> Cmd msg
delayed delay chatId content =
    case content of
        Text string ->
            sendText ( delay, ChatId.encode chatId, string )

        TextWithKeyboard string keyboard ->
            sendTextWithKeyboard ( delay, ChatId.encode chatId, string, keyboard )

        Photo photoId ->
            sendPhoto ( delay, ChatId.encode chatId, photoId )


batch : Time -> ChatId -> List Message -> Cmd msg
batch delay chatId messages =
    Cmd.batch <| batchHelper delay chatId messages 0 []


batchHelper : Time -> ChatId -> List Message -> Time -> List (Cmd msg) -> List (Cmd msg)
batchHelper delay chatId messages currentDelay previousMessages =
    case messages of
        [] ->
            previousMessages

        current :: rest ->
            batchHelper delay chatId rest (currentDelay + delay) (delayed currentDelay chatId current :: previousMessages)


port onText : (( Value, String ) -> msg) -> Sub msg


port onPhoto : (( Value, String ) -> msg) -> Sub msg


port sendText : ( Float, Value, String ) -> Cmd msg


port sendTextWithKeyboard : ( Float, Value, String, List (List String) ) -> Cmd msg


port sendPhoto : ( Float, Value, String ) -> Cmd msg
