import BlockComponent from './abstract/BlockComponent';
import BaseComponent from './abstract/BaseComponent';

export class Ol extends BlockComponent {
  static componentType = "ol";
  static rendererType = "list";

  static createPropertiesObject(args) {
    let properties = super.createPropertiesObject(args);
    properties.label = { default: undefined, forRenderer: true };
    return properties;
  }

  static returnChildLogic(args) {
    let childLogic = super.returnChildLogic(args);

    childLogic.newLeaf({
      name: "atLeastZeroLis",
      componentType: 'li',
      comparison: 'atLeast',
      number: 0,
      setAsBase: true
    });

    return childLogic;
  }

  static returnStateVariableDefinitions() {

    let stateVariableDefinitions = super.returnStateVariableDefinitions();

    stateVariableDefinitions.numbered = {
      forRenderer: true,
      returnDependencies: () => ({}),
      definition: () => ({ newValues: { numbered: true } })
    }

    stateVariableDefinitions.childrenToRender = {
      returnDependencies: () => ({
        liChildren: {
          dependencyType: "child",
          childLogicName: "atLeastZeroLis"
        }
      }),
      definition: function ({ dependencyValues }) {
        return {
          newValues: {
            childrenToRender: dependencyValues.liChildren.map(x => x.componentName)
          }
        }
      }
    }


    return stateVariableDefinitions;

  }

}


export class Ul extends Ol {
  static componentType = "ul";
  static rendererType = "list";

  static returnStateVariableDefinitions() {

    let stateVariableDefinitions = super.returnStateVariableDefinitions();

    stateVariableDefinitions.numbered = {
      forRenderer: true,
      returnDependencies: () => ({}),
      definition: () => ({ newValues: { numbered: false } })
    }

    return stateVariableDefinitions;

  }

}


export class Li extends BaseComponent {
  static componentType = "li";
  static rendererType = "list";

  static includeBlankStringChildren = true;

  static returnChildLogic(args) {
    let childLogic = super.returnChildLogic(args);

    let atLeastZeroInline = childLogic.newLeaf({
      name: "atLeastZeroInline",
      componentType: '_inline',
      comparison: 'atLeast',
      number: 0,
    });

    let atLeastZeroBlock = childLogic.newLeaf({
      name: "atLeastZeroBlock",
      componentType: '_block',
      comparison: 'atLeast',
      number: 0,
    });

    childLogic.newOperator({
      name: 'inlineOrBlock',
      operator: "or",
      propositions: [atLeastZeroInline, atLeastZeroBlock],
      setAsBase: true,
    })

    return childLogic;
  }


  static returnStateVariableDefinitions() {

    let stateVariableDefinitions = super.returnStateVariableDefinitions();

    stateVariableDefinitions.item = {
      forRenderer: true,
      returnDependencies: () => ({}),
      definition: () => ({ newValues: { item: true } })
    }

    stateVariableDefinitions.childrenToRender = {
      returnDependencies: () => ({
        children: {
          dependencyType: "child",
          childLogicName: "inlineOrBlock"
        }
      }),
      definition: function ({ dependencyValues }) {
        return {
          newValues: {
            childrenToRender: dependencyValues.children.map(x => x.componentName)
          }
        }
      }
    }


    return stateVariableDefinitions;

  }

}