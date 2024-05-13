import { VisibleSprite, EventTool } from '@webav/av-cliper';

export enum ESpriteManagerEvt {
  ActiveSpriteChange = 'activeSpriteChange',
  AddSprite = 'addSprite',
}

export class SpriteManager {
  #sprites: VisibleSprite[] = [];

  #activeSprite: VisibleSprite | null = null;

  #evtTool = new EventTool<{
    [ESpriteManagerEvt.AddSprite]: (s: VisibleSprite) => void;
    [ESpriteManagerEvt.ActiveSpriteChange]: (s: VisibleSprite | null) => void;
  }>();

  on = this.#evtTool.on;

  get activeSprite(): VisibleSprite | null {
    return this.#activeSprite;
  }
  set activeSprite(s: VisibleSprite | null) {
    if (s === this.#activeSprite) return;
    this.#activeSprite = s;
    this.#evtTool.emit(ESpriteManagerEvt.ActiveSpriteChange, s);
  }

  async addSprite(vs: VisibleSprite): Promise<void> {
    await vs.ready;
    this.#sprites.push(vs);
    this.#sprites = this.#sprites.sort((a, b) => a.zIndex - b.zIndex);
    vs.on('zIndexChange', () => {
      this.#sprites = this.#sprites.sort((a, b) => a.zIndex - b.zIndex);
    });

    this.#evtTool.emit(ESpriteManagerEvt.AddSprite, vs);
  }

  removeSprite(spr: VisibleSprite): void {
    this.#sprites = this.#sprites.filter((s) => s !== spr);
    spr.destroy();
  }

  getSprites(filter: { time: boolean } = { time: true }): VisibleSprite[] {
    return this.#sprites.filter(
      (s) =>
        s.visible &&
        (filter.time
          ? this.#renderTime >= s.time.offset &&
            this.#renderTime <= s.time.offset + s.time.duration
          : true)
    );
  }

  #renderTime = 0;
  updateRenderTime(time: number) {
    this.#renderTime = time;

    const as = this.activeSprite;
    if (
      as != null &&
      (time < as.time.offset || time > as.time.offset + as.time.duration)
    ) {
      this.activeSprite = null;
    }
  }

  destroy(): void {
    this.#evtTool.destroy();
    this.#sprites.forEach((s) => s.destroy());
    this.#sprites = [];
  }
}
