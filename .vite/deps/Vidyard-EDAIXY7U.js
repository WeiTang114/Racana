import {
  require_patterns,
  require_utils
} from "./chunk-ZQPDIFVJ.js";
import {
  require_react
} from "./chunk-65KY755N.js";
import {
  __commonJS
} from "./chunk-V4OQ3NZ2.js";

// node_modules/react-player/lib/players/Vidyard.js
var require_Vidyard = __commonJS({
  "node_modules/react-player/lib/players/Vidyard.js"(exports, module) {
    var __create = Object.create;
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __getProtoOf = Object.getPrototypeOf;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
      // If the importer is in node compatibility mode or this is not an ESM
      // file that has been converted to a CommonJS file using a Babel-
      // compatible transform (i.e. "__esModule" has not been set), then set
      // "default" to the CommonJS "module.exports" for node compatibility.
      isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
      mod
    ));
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var __publicField = (obj, key, value) => {
      __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
      return value;
    };
    var Vidyard_exports = {};
    __export(Vidyard_exports, {
      default: () => Vidyard
    });
    module.exports = __toCommonJS(Vidyard_exports);
    var import_react = __toESM(require_react());
    var import_utils = require_utils();
    var import_patterns = require_patterns();
    var SDK_URL = "https://play.vidyard.com/embed/v4.js";
    var SDK_GLOBAL = "VidyardV4";
    var SDK_GLOBAL_READY = "onVidyardAPI";
    var Vidyard = class extends import_react.Component {
      constructor() {
        super(...arguments);
        __publicField(this, "callPlayer", import_utils.callPlayer);
        __publicField(this, "mute", () => {
          this.setVolume(0);
        });
        __publicField(this, "unmute", () => {
          if (this.props.volume !== null) {
            this.setVolume(this.props.volume);
          }
        });
        __publicField(this, "ref", (container) => {
          this.container = container;
        });
      }
      componentDidMount() {
        this.props.onMount && this.props.onMount(this);
      }
      load(url) {
        const { playing, config, onError, onDuration } = this.props;
        const id = url && url.match(import_patterns.MATCH_URL_VIDYARD)[1];
        if (this.player) {
          this.stop();
        }
        (0, import_utils.getSDK)(SDK_URL, SDK_GLOBAL, SDK_GLOBAL_READY).then((Vidyard2) => {
          if (!this.container)
            return;
          Vidyard2.api.addReadyListener((data, player) => {
            if (this.player) {
              return;
            }
            this.player = player;
            this.player.on("ready", this.props.onReady);
            this.player.on("play", this.props.onPlay);
            this.player.on("pause", this.props.onPause);
            this.player.on("seek", this.props.onSeek);
            this.player.on("playerComplete", this.props.onEnded);
          }, id);
          Vidyard2.api.renderPlayer({
            uuid: id,
            container: this.container,
            autoplay: playing ? 1 : 0,
            ...config.options
          });
          Vidyard2.api.getPlayerMetadata(id).then((meta) => {
            this.duration = meta.length_in_seconds;
            onDuration(meta.length_in_seconds);
          });
        }, onError);
      }
      play() {
        this.callPlayer("play");
      }
      pause() {
        this.callPlayer("pause");
      }
      stop() {
        window.VidyardV4.api.destroyPlayer(this.player);
      }
      seekTo(amount, keepPlaying = true) {
        this.callPlayer("seek", amount);
        if (!keepPlaying) {
          this.pause();
        }
      }
      setVolume(fraction) {
        this.callPlayer("setVolume", fraction);
      }
      setPlaybackRate(rate) {
        this.callPlayer("setPlaybackSpeed", rate);
      }
      getDuration() {
        return this.duration;
      }
      getCurrentTime() {
        return this.callPlayer("currentTime");
      }
      getSecondsLoaded() {
        return null;
      }
      render() {
        const { display } = this.props;
        const style = {
          width: "100%",
          height: "100%",
          display
        };
        return import_react.default.createElement("div", { style }, import_react.default.createElement("div", { ref: this.ref }));
      }
    };
    __publicField(Vidyard, "displayName", "Vidyard");
    __publicField(Vidyard, "canPlay", import_patterns.canPlay.vidyard);
  }
});
export default require_Vidyard();
//# sourceMappingURL=Vidyard-EDAIXY7U.js.map
