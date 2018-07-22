module ChatId exposing (ChatId, decode, encode)

import Json.Decode as D
import Json.Encode as E


type ChatId
    = ChatId Int


decode : D.Value -> ChatId
decode value =
    case D.decodeValue D.int value of
        Ok id ->
            ChatId id

        Err error ->
            Debug.crash error


encode : ChatId -> E.Value
encode (ChatId id) =
    E.int id
