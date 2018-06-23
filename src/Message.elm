port module Message exposing (Message(..), sub, send, text, batch)

import Time exposing (Time)


type Message
    = Text String
    | TextWithKeyboard String (List (List String))
    | Photo String


sub : (Int -> Message -> msg) -> Sub msg
sub onMessage =
    Sub.batch
        [ onText (\( chatId, text ) -> onMessage chatId (Text text))
        , onPhoto (\( chatId, photoId ) -> onMessage chatId (Photo photoId))
        ]


send : Int -> Message -> Cmd msg
send =
    delayed 0


text : Int -> String -> Cmd msg
text chatId text =
    send chatId (Text text)


delayed : Time -> Int -> Message -> Cmd msg
delayed delay chatId content =
    case content of
        Text string ->
            sendText ( delay, chatId, string )

        TextWithKeyboard string keyboard ->
            sendTextWithKeyboard ( delay, chatId, string, keyboard )

        Photo photoId ->
            sendPhoto ( delay, chatId, photoId )


batch : Time -> Int -> List Message -> Cmd msg
batch delay chatId messages =
    Cmd.batch <| batchHelper delay chatId messages 0 []


batchHelper : Time -> Int -> List Message -> Time -> List (Cmd msg) -> List (Cmd msg)
batchHelper delay chatId messages currentDelay previousMessages =
    case messages of
        [] ->
            previousMessages

        current :: rest ->
            batchHelper delay chatId rest (currentDelay + delay) (delayed currentDelay chatId current :: previousMessages)


port onText : (( Int, String ) -> msg) -> Sub msg


port onPhoto : (( Int, String ) -> msg) -> Sub msg


port sendText : ( Float, Int, String ) -> Cmd msg


port sendTextWithKeyboard : ( Float, Int, String, List (List String) ) -> Cmd msg


port sendPhoto : ( Float, Int, String ) -> Cmd msg
