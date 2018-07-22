port module Sign exposing (Sign(..), toString, fromString, getRatings, onRatings, keyboard)

import Dict
import Json.Decode exposing (Value)
import ChatId exposing (ChatId)


type Sign
    = Tale
    | Shor
    | Teomim
    | Sartan
    | Arie
    | Betula
    | Moznaim
    | Akrav
    | Kashat
    | Gdi
    | Dli
    | Dagim


keyboard : List (List String)
keyboard =
    [ [ Tale
      , Shor
      , Teomim
      , Sartan
      ]
    , [ Arie
      , Betula
      , Moznaim
      , Akrav
      ]
    , [ Kashat
      , Gdi
      , Dli
      , Dagim
      ]
    ]
        |> List.map (List.map toString)


toString : Sign -> String
toString sign =
    case sign of
        Tale ->
            "טלה"

        Shor ->
            "שור"

        Teomim ->
            "תאומים"

        Sartan ->
            "סרטן"

        Arie ->
            "אריה"

        Betula ->
            "בתולה"

        Moznaim ->
            "מאזניים"

        Akrav ->
            "עקרב"

        Kashat ->
            "קשת"

        Gdi ->
            "גדי"

        Dli ->
            "דלי"

        Dagim ->
            "דגים"


fromString : String -> Maybe Sign
fromString string =
    case string of
        "טלה" ->
            Just Tale

        "שור" ->
            Just Shor

        "תאומים" ->
            Just Teomim

        "סרטן" ->
            Just Sartan

        "אריה" ->
            Just Arie

        "בתולה" ->
            Just Betula

        "מאזניים" ->
            Just Moznaim

        "עקרב" ->
            Just Akrav

        "קשת" ->
            Just Kashat

        "גדי" ->
            Just Gdi

        "דלי" ->
            Just Dli

        "דגים" ->
            Just Dagim

        _ ->
            Nothing


port getSignsAndDates : Value -> Cmd msg


port signsAndDates : (( Value, List String, List (Maybe Int) ) -> msg) -> Sub msg


getRatings : ChatId -> Cmd msg
getRatings chatId =
    getSignsAndDates (ChatId.encode chatId)


{-|
Takes a list of sign strings
and a list of the number of days since the day the horoscope was published.
Then it makes sure that there is no division by zero by adding an offset
such that the most recent published horoscope would have a grade of 1.
Then it makes pairs of (signString, grade) for each published post.
-}
gradeList : List String -> List (Maybe Int) -> List ( String, Float )
gradeList signStrings daysAgos =
    let
        nearest =
            daysAgos
                |> List.filterMap identity
                |> List.minimum
                |> Maybe.withDefault 0

        offset =
            1 - nearest

        gradePair signString daysAgo =
            case daysAgo of
                Just days ->
                    Just ( signString, 1 / toFloat (offset + days) )

                Nothing ->
                    Nothing
    in
        daysAgos
            |> List.map2 gradePair signStrings
            |> List.filterMap identity


parseSignsAndDates : ( Value, List String, List (Maybe Int) ) -> ( ChatId, List ( Sign, Float ) )
parseSignsAndDates ( chatId, signStrings, daysAgos ) =
    let
        addToDict ( signString, grade ) dict =
            Dict.update signString (Maybe.withDefault 0 >> (+) grade >> Just) dict

        unstringify ( signString, rating ) =
            case fromString signString of
                Just sign ->
                    Just ( sign, rating )

                Nothing ->
                    Nothing
    in
        ( ChatId.decode chatId
        , gradeList signStrings daysAgos
            |> List.foldl addToDict Dict.empty
            |> Dict.toList
            |> List.filterMap unstringify
        )


onRatings : (ChatId -> List ( Sign, Float ) -> msg) -> Sub msg
onRatings toMsg =
    signsAndDates (parseSignsAndDates >> \( chatId, rates ) -> toMsg chatId rates)
