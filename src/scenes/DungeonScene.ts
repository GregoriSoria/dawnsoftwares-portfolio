import { env } from './../env';
import Phaser from "phaser";
import Graphics from "../assets/Graphics";
import Player from "../entities/Player";
import Map from "../entities/Map";

const worldTileHeight = 21;
const worldTileWidth = 21;

const tileSize = 16;

export default class DungeonScene extends Phaser.Scene {
  lastX: number;
  lastY: number;
  player: Player | null;
  map: Map | null;
  tilemap: Phaser.Tilemaps.Tilemap | null;
  cameraResizeNeeded: boolean;
  layerGround: any;
  marker: Phaser.GameObjects.Graphics | null;
  capturedMarker: Phaser.GameObjects.Graphics | null;
  currentTile: Phaser.Tilemaps.Tile | null;
  currentLayer: Phaser.Tilemaps.DynamicTilemapLayer | Phaser.Tilemaps.StaticTilemapLayer | null;

  preload(): void {
    this.load.image(Graphics.environment.name, Graphics.environment.file);
    this.load.image(Graphics.util.name, Graphics.util.file);
    this.load.spritesheet(Graphics.player.name, Graphics.player.file, {
      frameHeight: Graphics.player.height,
      frameWidth: Graphics.player.width
    });
  }

  constructor() {
    super("DungeonScene");
    this.lastX = -1;
    this.lastY = -1;
    this.player = null;
    this.tilemap = null;
    this.marker = null;
    this.capturedMarker = null;
    this.map = null;
    this.currentTile = null;
    this.currentLayer = null;
    this.cameraResizeNeeded = false;
    console.log(this);
  }

  create(): void {
    this.map = new Map(worldTileWidth, worldTileHeight, this);
    this.tilemap = this.map.tilemap;

    Object.values(Graphics.player.animations).forEach(anim => {
      if (!this.anims.get(anim.name)) {
        this.anims.create({
          key: anim.name,
          frames: this.anims.generateFrameNumbers(Graphics.player.name, anim),
          frameRate: anim.frameRate,
          repeat: anim.repeat ? -1 : 0
        });
      }
    });

    this.player = new Player(
      this.tilemap.tileToWorldX(this.map.startingX),
      this.tilemap.tileToWorldY(this.map.startingY),
      this
    );

    this.cameras.main.setRoundPixels(true);
    this.cameras.main.setZoom(env.APP_ENV == 'DEV' ? 2 : 3);
    this.cameras.main.setBounds(
      0,
      0,
      this.map.width * Graphics.environment.width,
      this.map.height * Graphics.environment.height
    );

    this.cameras.main.startFollow(this.player.sprite);

    if (env.APP_ENV == 'DEV') {
      this.setDevOnCreate();
    } else {
      this.physics.add.collider(this.player.sprite, this.map.wallLayer);
      window.addEventListener("resize", () => {
        this.cameraResizeNeeded = true;
      });
    }

    this.scene.run("InfoScene");
  }

  update(time: number, delta: number) {
    this.player!.update(time);
    const camera = this.cameras.main;
    const cursorsKeys = this.input.keyboard.createCursorKeys();

    if (env.APP_ENV == 'DEV') {
      this.markerOnUpdate(cursorsKeys);
    }

    if (this.cameraResizeNeeded) {
      // Do this here rather than the resize callback as it limits
      // how much we'll slow down the game
      camera.setSize(window.innerWidth, window.innerHeight);
      this.cameraResizeNeeded = false;
    }

    // const player = new Phaser.Math.Vector2({
    //   x: this.tilemap!.worldToTileX(this.player!.sprite.body.x),
    //   y: this.tilemap!.worldToTileY(this.player!.sprite.body.y)
    // });

    // const bounds = new Phaser.Geom.Rectangle(
    //   this.tilemap!.worldToTileX(camera.worldView.x) - 1,
    //   this.tilemap!.worldToTileY(camera.worldView.y) - 1,
    //   this.tilemap!.worldToTileX(camera.worldView.width) + 2,
    //   this.tilemap!.worldToTileX(camera.worldView.height) + 2
    // );
  }

  changeLayer(key: Phaser.Input.Keyboard.Key) {
    if (!this.map || !this.tilemap) return;

    switch (key.keyCode) {
      case Phaser.Input.Keyboard.KeyCodes.ZERO:
        this.map.groundLayer.alpha = 1;
        this.map.wallLayer.alpha = 1;
        this.setCurrentLayer('All');
        break;

      case Phaser.Input.Keyboard.KeyCodes.ONE:
        this.map.groundLayer.alpha = 1;
        this.map.wallLayer.alpha = 0.3;
        this.setCurrentLayer('Ground');
        break;

      case Phaser.Input.Keyboard.KeyCodes.TWO:
        this.map.groundLayer.alpha = 0.3;
        this.map.wallLayer.alpha = 1;
        this.setCurrentLayer('Wall');
        break;
    }
  }

  private setDevOnCreate() {
    if (this.tilemap && this.map) {
      const tiles = this.tilemap.getTilesWithinWorldXY(this.map.startingX, this.map.startingY, tileSize, tileSize);
      if (tiles.length) {
        this.currentTile = tiles[tiles.length - 1];
      }
      this.marker = this.add.graphics();
      this.marker.lineStyle(2, 0x000000, 1);
      this.marker.strokeRect(0, 0, tileSize, tileSize);

      this.capturedMarker = this.add.graphics();
      this.capturedMarker.lineStyle(2, 0xFF0000, 1);
      this.capturedMarker.strokeRect(0, 0, tileSize, tileSize);

      this.input.keyboard.on("keydown_R", () => {
        this.scene.stop("InfoScene");
        this.scene.start("ReferenceScene");
      });

      this.setCurrentLayer('All');

      this.input.keyboard.on('keydown_ZERO', this.changeLayer, this);
      this.input.keyboard.on('keydown_ONE', this.changeLayer, this);
      this.input.keyboard.on('keydown_TWO', this.changeLayer, this);
    }
  }

  private setCurrentLayer(layerName: string) {
    if (!this.tilemap || !this.map) return;

    this.tilemap.setLayer(layerName);
    console.log('CurrentLayer: ' + layerName);
    switch (layerName) {
      case 'Ground':
        this.currentLayer = this.map.groundLayer;
        break;
      case 'Wall':
        this.currentLayer = this.map.wallLayer;
        break;
      case 'All':
      default:
        this.currentLayer = this.map.wallLayer;
        console.warn('CurrentLayer: All [Wall is last]');
    }
  }

  private markerOnUpdate(cursorKeys: Phaser.Input.Keyboard.CursorKeys) {
    if (!this.tilemap || !this.currentTile || !this.currentLayer) return;

    const worldX = this.input.activePointer.worldX;
    const worldY = this.input.activePointer.worldY;
    // console.log(this.currentLayer);
    const tiles = this.tilemap.getTilesWithinWorldXY(worldX, worldY, 0, 0, {}, this.cameras.main)
      .filter(t => /*lint*/this.currentLayer && t.layer.name == this.currentLayer.layer.name) || [];

    if (this.marker && this.capturedMarker && tiles.length) {
      this.marker.x = (tiles[tiles.length - 1].x * tileSize);
      this.marker.y = (tiles[tiles.length - 1].y * tileSize);

      if (this.input.mousePointer.isDown) {
        if (cursorKeys.shift && cursorKeys.shift.isDown) {
          this.currentTile = tiles[tiles.length - 1];
          this.capturedMarker.x = (tiles[tiles.length - 1].x * tileSize);
          this.capturedMarker.y = (tiles[tiles.length - 1].y * tileSize);
          console.log(this.currentTile);
        } else if (this.currentTile) {
          this.tilemap.putTileAt(this.currentTile, tiles[tiles.length - 1].x, tiles[tiles.length - 1].y);
        }
      }
    }
  }
}
