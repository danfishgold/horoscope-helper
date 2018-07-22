port module Upload exposing (upload, uploadResult)

import Sign
import ChatId exposing (ChatId)
import Horoscope exposing (Horoscope)
import Json.Encode exposing (Value)


upload : ChatId -> Horoscope -> Cmd msg
upload chatId { photoId, content, sign, censor } =
    uploadHoroscope ( ChatId.encode chatId, photoId, content, Sign.toString sign, censor )


uploadResult : (ChatId -> Result String () -> msg) -> Sub msg
uploadResult toMsg =
    Sub.batch
        [ errorUploading (\( chatId, err ) -> toMsg (ChatId.decode chatId) (Err err))
        , doneUploading (\chatId -> toMsg (ChatId.decode chatId) (Ok ()))
        ]


port errorUploading : (( Value, String ) -> msg) -> Sub msg


port doneUploading : (Value -> msg) -> Sub msg


port uploadHoroscope : ( Value, String, String, String, String ) -> Cmd msg
