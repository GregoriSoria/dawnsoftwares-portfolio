import Phaser from "phaser";
import Graphics from "../assets/Graphics";

const speed = 125;
const attackSpeed = 500;
const attackDuration = 165;
const attackCooldown = attackDuration * 2;

interface Keys {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
  space: Phaser.Input.Keyboard.Key;
  w: Phaser.Input.Keyboard.Key;
  a: Phaser.Input.Keyboard.Key;
  s: Phaser.Input.Keyboard.Key;
  d: Phaser.Input.Keyboard.Key;
}

export default class Player {
  public sprite: Phaser.Physics.Arcade.Sprite;
  private keys: Keys;

  private attackUntil: number;
  private attackLockedUntil: number;
  private emitter: Phaser.GameObjects.Particles.ParticleEmitter;
  private body: Phaser.Physics.Arcade.Body;

  private lastPressedArrowKey: any;

  constructor(x: number, y: number, scene: Phaser.Scene) {
    this.sprite = scene.physics.add.sprite(x, y, Graphics.player.name, 0);
    this.sprite.setSize(12, 10);
    this.sprite.setOffset(10, 18);
    this.sprite.anims.play(Graphics.player.animations.idleDown.name);

    this.keys = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      w: "w",
      a: "a",
      s: "s",
      d: "d"
    }) as Keys;

    this.attackUntil = 0;
    this.attackLockedUntil = 0;
    const particles = scene.add.particles(Graphics.player.name);
    this.emitter = particles.createEmitter({
      alpha: { start: 0.7, end: 0, ease: "Cubic.easeOut" },
      follow: this.sprite,
      quantity: 1,
      lifespan: 200,
      blendMode: Phaser.BlendModes.ADD,
      scaleX: () => (this.sprite.flipX ? -1 : 1),
      emitCallback: (particle: Phaser.GameObjects.Particles.Particle) => {
        particle.frame = this.sprite.frame;
      }
    });
    this.emitter.stop();

    this.body = <Phaser.Physics.Arcade.Body>this.sprite.body;
  }

  update(time: number) {
    const keys = this.keys;
    let attackAnim = "";
    let moveAnim = "";

    if (time < this.attackUntil) {
      return;
    }
    this.body.setVelocity(0);

    const left = keys.left.isDown || keys.a.isDown;
    const right = keys.right.isDown || keys.d.isDown;
    const up = keys.up.isDown || keys.w.isDown;
    const down = keys.down.isDown || keys.s.isDown;

    if (!this.body.blocked.left && left) {
      this.body.setVelocityX(-speed);
      this.sprite.setFlipX(true);
    } else if (!this.body.blocked.right && right) {
      this.body.setVelocityX(speed);
      this.sprite.setFlipX(false);
    }

    if (!this.body.blocked.up && up) {
      this.body.setVelocityY(-speed);
    } else if (!this.body.blocked.down && down) {
      this.body.setVelocityY(speed);
    }

    if (left || right) {
      moveAnim = Graphics.player.animations.walkRight.name;
      attackAnim = Graphics.player.animations.slash.name;

      if (keys.left.isDown) {
        this.lastPressedArrowKey = keys.left;
      } else {
        this.lastPressedArrowKey = keys.left;
      }
    } else if (down) {
      moveAnim = Graphics.player.animations.walkFront.name;
      attackAnim = Graphics.player.animations.slashDown.name;
      this.lastPressedArrowKey = keys.down;
    } else if (up) {
      moveAnim = Graphics.player.animations.walkBack.name;
      attackAnim = Graphics.player.animations.slashUp.name;
      this.lastPressedArrowKey = keys.up;
    } else {
      switch (this.lastPressedArrowKey) {
        case keys.left:
          moveAnim = Graphics.player.animations.idleLeft.name;
          break;
        case keys.right:
          moveAnim = Graphics.player.animations.idleRight.name;
          break;
        case keys.up:
          moveAnim = Graphics.player.animations.idleUp.name;
          break;
        case keys.down:
          moveAnim = Graphics.player.animations.idleDown.name;
          break;
        default:
          moveAnim = Graphics.player.animations.idleDown.name;
      }
    }

    if (
      keys.space!.isDown &&
      time > this.attackLockedUntil &&
      this.body.velocity.length() > 0
    ) {
      this.attackUntil = time + attackDuration;
      this.attackLockedUntil = time + attackDuration + attackCooldown;
      this.body.velocity.normalize().scale(attackSpeed);
      //this.sprite.anims.play(attackAnim, true); // only for RoguePlayer.png
      this.emitter.start();
      this.sprite.setBlendMode(Phaser.BlendModes.ADD);
    } else {
      this.sprite.anims.play(moveAnim, true);
      this.body.velocity.normalize().scale(speed);
      this.sprite.setBlendMode(Phaser.BlendModes.NORMAL);
      if (this.emitter.on) {
        this.emitter.stop();
      }
    }
  }
}
