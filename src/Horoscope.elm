module Horoscope exposing (Horoscope)

import Sign exposing (Sign)


type alias Horoscope =
    { photoId : String
    , content : String
    , sign : Sign
    , censor : String
    }
