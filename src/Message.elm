port module Message exposing (Message, Content(..), sub, send)

import Json.Decode


type Content
    = Text String
    | Photo String


type alias Message =
    { chatId : Int
    , content : Content
    }


sub : (Message -> msg) -> Sub msg
sub onMessage =
    Sub.batch
        [ onText (fromText >> onMessage)
        , onPhoto (fromPhoto >> onMessage)
        ]


send : Message -> Cmd msg
send { chatId, content } =
    case content of
        Text string ->
            sendText ( string, chatId )

        Photo photoId ->
            sendPhoto ( photoId, chatId )


fromText : ( String, Int ) -> Message
fromText ( text, chatId ) =
    Message chatId (Text text)


fromPhoto : ( String, Int ) -> Message
fromPhoto ( photoId, chatId ) =
    Message chatId (Photo photoId)


port onText : (( String, Int ) -> msg) -> Sub msg


port onPhoto : (( String, Int ) -> msg) -> Sub msg


port sendText : ( String, Int ) -> Cmd msg


port sendPhoto : ( String, Int ) -> Cmd msg
