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
  tilemap: Phaser.Tilemaps.Tilemap | null;
  cameraResizeNeeded: boolean;
  layerGround: any;
  marker: any;

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
    this.cameraResizeNeeded = false;
    console.log(this);
  }

  create(): void {
    const map = new Map(worldTileWidth, worldTileHeight, this);
    this.tilemap = map.tilemap;

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
      this.tilemap.tileToWorldX(map.startingX),
      this.tilemap.tileToWorldY(map.startingY),
      this
    );

    this.cameras.main.setRoundPixels(true);
    this.cameras.main.setZoom(3);
    this.cameras.main.setBounds(
      0,
      0,
      map.width * Graphics.environment.width,
      map.height * Graphics.environment.height
    );

    this.cameras.main.startFollow(this.player.sprite);

    if (env.APP_ENV != 'DEV') {
      this.physics.add.collider(this.player.sprite, map.wallLayer);
      window.addEventListener("resize", () => {
        this.cameraResizeNeeded = true;
      });
    } else {


      this.marker = this.add.graphics();
      this.marker.lineStyle(2, 0x000000, 1);
      this.marker.strokeRect(0, 0, tileSize, tileSize);
    }

    this.input.keyboard.on("keydown_R", () => {
      this.scene.stop("InfoScene");
      this.scene.start("ReferenceScene");
    });

    this.scene.run("InfoScene");
  }

  update(time: number, delta: number) {
    this.player!.update(time);
    const camera = this.cameras.main;

    const layerGround = this.tilemap.layers.find(l => l.name == 'Ground');
    //console.log(layerGround);

    const worldX = this.input.activePointer.worldX;
    const worldY = this.input.activePointer.worldY;
    const tiles = this.tilemap.getTilesWithinWorldXY(worldX, worldY, tileSize, tileSize, this.cameras.main/*, layerGround */);
    //console.log(worldX, worldY, tiles);

    if (tiles.length) {
      this.marker.x = (tiles[tiles.length - 1].x * tileSize) - tileSize;
      this.marker.y = (tiles[tiles.length - 1].y * tileSize) - tileSize;
    }

    if (this.cameraResizeNeeded) {
      // Do this here rather than the resize callback as it limits
      // how much we'll slow down the game
      camera.setSize(window.innerWidth, window.innerHeight);
      this.cameraResizeNeeded = false;
    }

    const player = new Phaser.Math.Vector2({
      x: this.tilemap!.worldToTileX(this.player!.sprite.body.x),
      y: this.tilemap!.worldToTileY(this.player!.sprite.body.y)
    });

    const bounds = new Phaser.Geom.Rectangle(
      this.tilemap!.worldToTileX(camera.worldView.x) - 1,
      this.tilemap!.worldToTileY(camera.worldView.y) - 1,
      this.tilemap!.worldToTileX(camera.worldView.width) + 2,
      this.tilemap!.worldToTileX(camera.worldView.height) + 2
    );
  }
}
