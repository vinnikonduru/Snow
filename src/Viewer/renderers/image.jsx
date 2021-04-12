import React from 'react';
import DoenetRenderer from './DoenetRenderer';

export default class Image extends DoenetRenderer {

  render() {

    if (this.doenetSvData.hidden) {
      return null;
    }

    if (this.doenetSvData.source) {

      return <React.Fragment>
        <a name={this.componentName} />
        <img id={this.componentName} src={this.doenetSvData.source} width={this.doenetSvData.width} height={this.doenetSvData.height} alt={this.doenetSvData.description}/>
      </React.Fragment>

    }

    return null;

  }
}