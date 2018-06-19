module Sign exposing (Sign(..), toString, fromString)


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
