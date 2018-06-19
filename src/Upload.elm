port module Upload exposing (upload, uploadResult)

import Sign
import Horoscope exposing (Horoscope)


upload : Int -> Horoscope -> Cmd msg
upload chatId { photoId, content, sign, censor } =
    uploadHoroscope ( chatId, photoId, content, Sign.toString sign, censor )


uploadResult : (Int -> Result String () -> msg) -> Sub msg
uploadResult toMsg =
    Sub.batch
        [ errorUploading (\( chatId, err ) -> toMsg chatId (Err err))
        , doneUploading (\chatId -> toMsg chatId (Ok ()))
        ]


port errorUploading : (( Int, String ) -> msg) -> Sub msg


port doneUploading : (Int -> msg) -> Sub msg


port uploadHoroscope : ( Int, String, String, String, String ) -> Cmd msg
