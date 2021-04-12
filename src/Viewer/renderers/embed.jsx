import React from 'react';
import DoenetRenderer from './DoenetRenderer';
import cssesc from 'cssesc';

export default class Embed extends DoenetRenderer {

  componentDidMount() {

    if (this.doenetSvData.encodedGeogebraContent) {

      let doenetSvData = this.doenetSvData;

      let cName = cssesc(this.componentName);

      window.MathJax.Hub.Register.StartupHook("End", function () {
        let parameters = {
          id: cName,
          width: doenetSvData.width,
          height: doenetSvData.height,
          showResetIcon: false,
          enableLabelDrags: false,
          useBrowserForJS: true,
          showMenubar: false,
          errorDialogsActive: true,
          showToolbar: false,
          showAlgebraicInput: false,
          enableShiftDragZoom: true,
          enableRightClick: true,
          showToolBarHelp: false,
          ggbBase64: doenetSvData.encodedGeogebraContent.trim(),
          language: "en",
          country: "US",
          isPreloader: false,
          screenshotGenerator: false,
          preventFocus: false,
          fixApplet: false,
          prerelease: false,
          playButtonAutoDecide: true,
          playButton: false,
          canary: false,
          allowUpscale: false
        };
        let applet = new window.GGBApplet(parameters, true);
        applet.setHTML5Codebase('/geogebra/HTML5/5.0/web/', 'true');
        applet.inject("container_" + cName, 'preferhtml5');
      });

      this.forceUpdate();
    }
  }

  render() {

    if (this.doenetSvData.hidden) {
      return null;
    }

    if (this.doenetSvData.geogebra) {
      return <div className="geogebra" id={this.componentName}>
        <a name={this.componentName} />
        <iframe scrolling="no" title="" src={`https://www.geogebra.org/material/iframe/id/${this.doenetSvData.geogebra}/width/${this.doenetSvData.width}/height/${this.doenetSvData.height}/border/888888/sfsb/true/smb/false/stb/false/stbh/false/ai/false/asb/false/sri/false/rc/false/ld/false/sdz/false/ctl/false`} width={this.doenetSvData.width} height={this.doenetSvData.height} style={{ border: "0px" }}> </iframe>
      </div>
    } else if (this.doenetSvData.encodedGeogebraContent) {
      return <div className="javascriptapplet" id={cssesc(this.componentName)}>
        <div className="geogebrawebapplet" id={"container_" + cssesc(this.componentName)}
          style={{ minWidth: this.doenetSvData.width, minHeight: this.doenetSvData.height }} />
      </div>

    }

    console.warn("Nothing specified to embed");
    return null;

  }
}