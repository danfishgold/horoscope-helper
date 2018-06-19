port module Main exposing (main)

import Json.Decode
import Platform exposing (program)


port inPort : (String -> msg) -> Sub msg


port outPort : String -> Cmd msg


main : Program Never Model Msg
main =
    program { init = init, subscriptions = subscriptions, update = update }


type alias Model =
    {}


type Msg
    = In String


init : ( Model, Cmd Msg )
init =
    ( Debug.log "Hey" {}, Cmd.none )


subscriptions : Model -> Sub Msg
subscriptions model =
    inPort In


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        In str ->
            ( model, outPort str )
