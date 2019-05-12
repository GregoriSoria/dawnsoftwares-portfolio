import Phaser from "phaser";

export default class InfoScene extends Phaser.Scene {
  constructor() {
    super({ key: "InfoScene" });
  }

  create(): void {
    const content = [
      "Portfolio | DAWN Softwares!",
    ];
    const text = this.add.text(25, 25, content, {
      fontFamily: "sans-serif",
      color: "#ffffff"
    });
    text.setAlpha(0.9);
  }
}
