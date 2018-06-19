port module Message exposing (Message(..), sub, send)


type Message
    = Text String
    | Photo String


sub : (Int -> Message -> msg) -> Sub msg
sub onMessage =
    Sub.batch
        [ onText (\( chatId, text ) -> onMessage chatId (Text text))
        , onText (\( chatId, photoId ) -> onMessage chatId (Photo photoId))
        ]


send : Int -> Message -> Cmd msg
send chatId content =
    case content of
        Text string ->
            sendText ( chatId, string )

        Photo photoId ->
            sendPhoto ( chatId, photoId )


port onText : (( Int, String ) -> msg) -> Sub msg


port onPhoto : (( Int, String ) -> msg) -> Sub msg


port sendText : ( Int, String ) -> Cmd msg


port sendPhoto : ( Int, String ) -> Cmd msg
