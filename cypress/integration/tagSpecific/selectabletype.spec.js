import me from 'math-expressions';
import cssesc from 'cssesc';

function cesc(s) {
  s = cssesc(s, { isIdentifier: true });
  if (s.slice(0, 2) === '\\#') {
    s = s.slice(1);
  }
  return s;
}

describe('Selectable Type Tag Tests', function () {

  beforeEach(() => {
    cy.visit('/test')
  })

  it('from with number string', () => {
    cy.window().then((win) => {
      win.postMessage({
        doenetML: `
    <text>a</text>
    <from>7</from>
    <copy prop="value" tname="_from1" />
    `}, "*");
    });

    cy.get('#\\/_text1').should('have.text', 'a');  // to wait until loaded

    cy.window().then((win) => {
      let components = Object.assign({}, win.state.components);
      let numberAnchor = cesc("#" + components["/_copy1"].replacements[0].componentName);

      cy.get(numberAnchor).should('have.text','7');

      cy.window().then((win) => {
        let components = Object.assign({}, win.state.components);
        expect(components['/_from1'].stateValues.type).eq("number");
        expect(components['/_from1'].stateValues.value).eq(7);

      })
    })
  });

  it('from with letter string', () => {
    cy.window().then((win) => {
      win.postMessage({
        doenetML: `
    <text>a</text>
    <from type="letters">q</from>
    <copy prop="value" tname="_from1" />
    `}, "*");
    });


    cy.get('#\\/_text1').should('have.text', 'a');  // to wait until loaded

    cy.window().then((win) => {
      let components = Object.assign({}, win.state.components);
      let letterAnchor = cesc("#" + components["/_copy1"].replacements[0].componentName);

      cy.get(letterAnchor).should('have.text', 'q')

      cy.window().then((win) => {
        let components = Object.assign({}, win.state.components);
        expect(components['/_from1'].stateValues.type).eq("letters");
        expect(components['/_from1'].stateValues.value).eq('q');
      })
    })
  });

  it('from with letternumber string', () => {
    cy.window().then((win) => {
      win.postMessage({
        doenetML: `
    <text>a</text>
    <from type="text">z3</from>
    <copy prop="value" tname="_from1" />
    `}, "*");
    });


    cy.get('#\\/_text1').should('have.text', 'a');  // to wait until loaded

    cy.window().then((win) => {
      let components = Object.assign({}, win.state.components);
      let textAnchor = cesc("#" + components["/_copy1"].replacements[0].componentName);

      cy.get(textAnchor).should('have.text', 'z3')

      cy.window().then((win) => {
        let components = Object.assign({}, win.state.components);
        expect(components['/_from1'].stateValues.type).eq("text");
        expect(components['/_from1'].stateValues.value).eq('z3');
      })
    })
  });

  it('from with boolean child', () => {
    cy.window().then((win) => {
      win.postMessage({
        doenetML: `
    <text>a</text>
    <from type="boolean"><boolean>false</boolean></from>
    <copy prop="value" tname="_from1" />
    `}, "*");
    });


    cy.get('#\\/_text1').should('have.text', 'a');  // to wait until loaded

    cy.window().then((win) => {
      let components = Object.assign({}, win.state.components);
      let booleanAnchor = cesc("#" + components["/_copy1"].replacements[0].componentName);

      cy.get(booleanAnchor).should('have.text', 'false')

      cy.window().then((win) => {
        let components = Object.assign({}, win.state.components);
        expect(components['/_from1'].stateValues.type).eq("boolean");
        expect(components['/_from1'].stateValues.value).eq(false);
      })
    })
  });

  it('from with dynamic boolean child', () => {
    cy.window().then((win) => {
      win.postMessage({
        doenetML: `
    <text>a</text>
    <from type="boolean"><copy prop="value" tname="b" /></from>
    <copy prop="value" tname="_from1" />
    <booleaninput name="b"/>
    `}, "*");
    });


    cy.get('#\\/_text1').should('have.text', 'a');  // to wait until loaded

    cy.window().then((win) => {
      let components = Object.assign({}, win.state.components);
      let booleanAnchor = cesc("#" + components["/_copy2"].replacements[0].componentName);

      cy.get(booleanAnchor).should('have.text', 'false')

      cy.window().then((win) => {
        let components = Object.assign({}, win.state.components);
        expect(components['/_from1'].stateValues.type).eq("boolean");
        expect(components['/_from1'].stateValues.value).eq(false);
      })

      cy.log('check the box')
      cy.get('#\\/b_input').click();

      cy.get(booleanAnchor).should('have.text', 'true')

      cy.window().then((win) => {
        let components = Object.assign({}, win.state.components);
        expect(components['/_from1'].stateValues.type).eq("boolean");
        expect(components['/_from1'].stateValues.value).eq(true);
      })

      cy.log('uncheck the box')
      cy.get('#\\/b_input').click();

      cy.get(booleanAnchor).should('have.text', 'false')

      cy.window().then((win) => {
        let components = Object.assign({}, win.state.components);
        expect(components['/_from1'].stateValues.type).eq("boolean");
        expect(components['/_from1'].stateValues.value).eq(false);
      })
    })
  });

  it('exclude with number string', () => {
    cy.window().then((win) => {
      win.postMessage({
        doenetML: `
    <text>a</text>
    <exclude>3 7</exclude>
    <p><aslist><copy prop="values" tname="_exclude1" /></aslist></p>
    `}, "*");
    });


    cy.get('#\\/_text1').should('have.text', 'a');  // to wait until loaded

    cy.window().then((win) => {
      let components = Object.assign({}, win.state.components);
      let number1Anchor = cesc("#" + components["/_copy1"].replacements[0].componentName);
      let number2Anchor = cesc("#" + components["/_copy1"].replacements[1].componentName);

      cy.get(number1Anchor).should('have.text', '3');
      cy.get(number2Anchor).should('have.text', '7');

      cy.window().then((win) => {
        let components = Object.assign({}, win.state.components);
        expect(components['/_exclude1'].stateValues.type).eq("number");
        expect(components['/_exclude1'].stateValues.values).eqls([3, 7]);

      })
    })
  });

  it('exclude with letters string', () => {
    cy.window().then((win) => {
      win.postMessage({
        doenetML: `
    <text>a</text>
    <exclude type="letters">q u</exclude>
    <p><aslist><copy prop="values" tname="_exclude1" /></aslist></p>
    `}, "*");
    });


    cy.get('#\\/_text1').should('have.text', 'a');  // to wait until loaded

    cy.window().then((win) => {
      let components = Object.assign({}, win.state.components);
      let text1Anchor = cesc("#" + components["/_copy1"].replacements[0].componentName);
      let text2Anchor = cesc("#" + components["/_copy1"].replacements[1].componentName);

      cy.get(text1Anchor).should('have.text', 'q')
      cy.get(text2Anchor).should('have.text', 'u')
      cy.window().then((win) => {
        let components = Object.assign({}, win.state.components);
        expect(components['/_exclude1'].stateValues.type).eq("letters");
        expect(components['/_exclude1'].stateValues.values).eqls(['q', 'u']);
      })
    })

  });

  it('exclude with letternumber string', () => {
    cy.window().then((win) => {
      win.postMessage({
        doenetML: `
    <text>a</text>
    <exclude type="text">2 i</exclude>
    <p><aslist><copy prop="values" tname="_exclude1" /></aslist></p>
    `}, "*");
    });


    cy.get('#\\/_text1').should('have.text', 'a');  // to wait until loaded

    cy.window().then((win) => {
      let components = Object.assign({}, win.state.components);
      let text1Anchor = cesc("#" + components["/_copy1"].replacements[0].componentName);
      let text2Anchor = cesc("#" + components["/_copy1"].replacements[1].componentName);

      cy.get(text1Anchor).should('have.text', '2')
      cy.get(text2Anchor).should('have.text', 'i')
      cy.window().then((win) => {
        let components = Object.assign({}, win.state.components);
        expect(components['/_exclude1'].stateValues.type).eq("text");
        expect(components['/_exclude1'].stateValues.values).eqls(['2', 'i']);
      })
    })

  });

});

