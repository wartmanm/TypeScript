//// [jsxVue.tsx]
describe('babel-plugin-transform-vue-jsx', () => {
  it('should contain text', () => {
    const vnode = render(h => <div>test</div>);
    expect(vnode.tag).to.equal('div');
    expect(vnode.children[0].text).to.equal('test');
  });

  it('should bind text', () => {
    const text = 'foo';
    const vnode = render(h => <div>{text}</div>);
    expect(vnode.tag).to.equal('div');
    expect(vnode.children[0].text).to.equal('foo');
  });

  it('should extract attrs', () => {
    const vnode = render(h => <div id="hi" dir="ltr"></div>);
    expect(vnode.data.attrs.id).to.equal('hi');
    expect(vnode.data.attrs.dir).to.equal('ltr');
  });

  it('should bind attr', () => {
    const id = 'foo';
    const vnode = render(h => <div id={id}></div>);
    expect(vnode.data.attrs.id).to.equal('foo');
  });

  it('should omit attribs if possible', () => {
    const vnode = render(h => <div>test</div>);
    expect(vnode.data).to.equal(undefined);
  });

  it('should omit children argument if possible', () => {
    const vnode = render(h => <div />);
    const children = vnode.children;
    expect(children).to.equal(undefined);
  });

  it('should handle top-level special attrs', () => {
    const vnode = render(h => (
      <div
        class="foo"
        style="bar"
        key="key"
        ref="ref"
        refInFor
        slot="slot">
      </div>
    ));
    expect(vnode.data.class).to.equal('foo');
    expect(vnode.data.style).to.equal('bar');
    expect(vnode.data.key).to.equal('key');
    expect(vnode.data.ref).to.equal('ref');
    expect(vnode.data.refInFor).to.be.true;
    expect(vnode.data.slot).to.equal('slot');
  })

  it('should handle nested properties', () => {
    const noop = _ => _;
    const vnode = render(h => (
      <div
        props-on-success={noop}
        on-click={noop}
        on-kebab-case={noop}
        domProps-innerHTML="<p>hi</p>"
        hook-insert={noop}>
      </div>
    ));
    expect(vnode.data.props['on-success']).to.equal(noop);
    expect(vnode.data.on.click).to.equal(noop);
    expect(vnode.data.on['kebab-case']).to.equal(noop);
    expect(vnode.data.domProps.innerHTML).to.equal('<p>hi</p>');
    expect(vnode.data.hook.insert).to.equal(noop);
  })

  it('should handle nested properties (camelCase)', () => {
    const noop = _ => _;
    const vnode = render(h => (
      <div
        propsOnSuccess={noop}
        onClick={noop}
        onCamelCase={noop}
        domPropsInnerHTML="<p>hi</p>"
        hookInsert={noop}>
      </div>
    ));
    expect(vnode.data.props.onSuccess).to.equal(noop);
    expect(vnode.data.on.click).to.equal(noop);
    expect(vnode.data.on.camelCase).to.equal(noop);
    expect(vnode.data.domProps.innerHTML).to.equal('<p>hi</p>');
    expect(vnode.data.hook.insert).to.equal(noop);
  });

  it('should support data attributes', () => {
    const vnode = render(h => (
      <div data-id="1"></div>
    ));
    expect(vnode.data.attrs['data-id']).to.equal('1');
  });

  it('should handle identifier tag name as components', () => {
    const Test = {};
    const vnode = render(h => <Test/>);
    expect(vnode.tag).to.contain('vue-component');
  });

  it('should work for components with children', () => {
    const Test = {};
    const vnode = render(h => <Test><div>hi</div></Test>);
    const children = vnode.componentOptions.children;
    expect(children[0].tag).to.equal('div');
  });

  it('should bind things in thunk with correct this context', () => {
    const Test = {
      render (h) {
        return <div>{this.$slots.default}</div>
      }
    };
    const context = { test: 'foo' };
    const vnode = render((function (h) {
      return <Test>{this.test}</Test>
    }).bind(context));
    const vm = createComponentInstanceForVnode(vnode);
    const childVnode = vm._render();
    expect(childVnode.tag).to.equal('div');
    expect(childVnode.children[0].text).to.equal('foo');
  });

  it('spread (single object expression)', () => {
    const props = {
      innerHTML: 2
    };
    const vnode = render(h => (
      <div {...{ props }}/>
    ));
    expect(vnode.data.props.innerHTML).to.equal(2);
  })

  it('spread (mixed)', () => {
    const calls = [];
    const data = {
      attrs: {
        id: 'hehe'
      },
      on: {
        click: function () {
          calls.push(1);
        }
      },
      props: {
        innerHTML: 2
      },
      hook: {
        insert: function () {
          calls.push(3);
        }
      },
      class: ['a', 'b']
    };
    const vnode = render(h => (
      <div href="huhu"
        {...data}
        class={{ c: true }}
        on-click={() => calls.push(2)}
        hook-insert={() => calls.push(4)} />
    ));

    expect(vnode.data.attrs.id).to.equal('hehe');
    expect(vnode.data.attrs.href).to.equal('huhu');
    expect(vnode.data.props.innerHTML).to.equal(2);
    expect(vnode.data.class).to.deep.equal(['a', 'b', { c: true }]);
    // merge handlers properly for on
    vnode.data.on.click();
    expect(calls).to.deep.equal([1, 2]);
    // merge hooks properly
    vnode.data.hook.insert();
    expect(calls).to.deep.equal([1, 2, 3, 4]);
  });

  it('custom directives', () => {
    const vnode = render(h => (
      <div v-test={ 123 } v-other={ 234 } />
    ));

    expect(vnode.data.directives.length).to.equal(2);
    expect(vnode.data.directives[0]).to.deep.equal({ name: 'test', value: 123 });
    expect(vnode.data.directives[1]).to.deep.equal({ name: 'other', value: 234 });
  })

  it('xlink:href', () => {
    const vnode = render(h => (
      <use xlinkHref={'#name'}></use>
    ));

    expect(vnode.data.attrs['xlink:href']).to.equal('#name');
  })

  it('merge class', () => {
    const vnode = render(h => (
      <div class="a" {...{ class: 'b' }}/>
    ));

    expect(vnode.data.class).to.deep.equal({ a: true, b: true });
  })

  it('h injection in object methods', () => {
    const obj = {
      method () {
        return <div>test</div>;
      }
    };
    const vnode = render(h => obj.method.call({ $createElement: h }));
    expect(vnode.tag).to.equal('div');
    expect(vnode.children[0].text).to.equal('test');
  })

  it('h should not be injected in nested JSX expressions', () => {
    const obj = {
      method () {
        return <div foo={{
          render () {
            return <div>bar</div>;
          }
        }}>test</div>;
      }
    };
    const vnode = render(h => obj.method.call({ $createElement: h }));
    expect(vnode.tag).to.equal('div');
    const nested = vnode.data.attrs.foo.render();
    expect(nested.tag).to.equal('div');
    expect(nested.children[0].text).to.equal('bar');
  });

  it('h injection in object getters', () => {
    const obj: any = {
      get computed () {
        return <div>test</div>;
      }
    };
    const vnode = render(h => {
      obj.$createElement = h;
      return obj.computed;
    });
    expect(vnode.tag).to.equal('div');
    expect(vnode.children[0].text).to.equal('test');
  });

  it('h injection in multi-level object getters', () => {
    const obj: any = {
      inherited: {
        get computed () {
          return <div>test</div>;
        }
      }
    };
    const vnode = render(h => {
      obj.inherited.$createElement = h;
      return obj.inherited.computed;
    });
    expect(vnode.tag).to.equal('div');
    expect(vnode.children[0].text).to.equal('test');
  });

  it('h injection in class methods', () => {
    class Test {
      $createElement: any;
      constructor (h) {
        this.$createElement = h;
      }
      render () {
        return <div>test</div>;
      }
    };
    const vnode = render(h => (new Test(h)).render(h));
    expect(vnode.tag).to.equal('div');
    expect(vnode.children[0].text).to.equal('test');
  });

  it('h injection in class getters', () => {
    class Test {
      $createElement: any;
      constructor (h) {
        this.$createElement = h;
      }
      get computed () {
        return <div>test</div>;
      }
    };
    const vnode = render(h => (new Test(h)).computed);
    expect(vnode.tag).to.equal('div');
    expect(vnode.children[0].text).to.equal('test');
  });

  it('h injection in methods with parameters', () => {
    class Test {
      $createElement: any;
      constructor (h) {
        this.$createElement = h;
      }
      notRender (notH) {
        return <div>{notH}</div>;
      }
    };
    const vnode = render(h => (new Test(h)).notRender('test'));
    expect(vnode.tag).to.equal('div');
    expect(vnode.children[0].text).to.equal('test');
  });

  it('should handle special attrs properties', () => {
    const vnode = render(h => (
      <input value="value" />
    ));
    expect(vnode.data.attrs.value).to.equal('value');
  });

  it('should handle special domProps properties', () => {
    const vnode = render(h => (
      <input value={'some jsx expression'} />
    ));
    expect(vnode.data.domProps.value).to.equal('some jsx expression');
  });
});

// helpers

function render (render: any): any {
  return undefined;
}

function createComponentInstanceForVnode (vnode: any): any {
  return undefined;
}

function describe(key: string, callback: () => void) { }
function it(name: string, callback: () => void) { }
function expect(value: any) {
  return {
    to: {
      equal: function(value: any) { },
      deep: {
        equal: function(value: any) { }
      },
      contain: function(value: any) { },
      be: {
        true: true,
        false: false
      }
    }
  };
}
;


//// [jsxVue.js]
var __vueJsxMergeProps = (function () {
    var nestRE = /^(attrs|props|on|nativeOn|class|style|hook)$/;
    return function (objs) {
        return objs.reduce(function (a, b) {
            var aa, bb, key, nestedKey, temp;
            for (key in b) {
                aa = a[key];
                bb = b[key];
                if (aa && nestRE.test(key)) {
                    // normalize class
                    if (key === 'class') {
                        if (typeof aa === 'string') {
                            temp = aa;
                            a[key] = aa = {};
                            aa[temp] = true;
                        }
                        if (typeof bb === 'string') {
                            temp = bb;
                            b[key] = bb = {};
                            bb[temp] = true;
                        }
                    }
                    if (key === 'on' || key === 'nativeOn' || key === 'hook') {
                        // merge functions
                        for (nestedKey in bb) {
                            aa[nestedKey] = mergeFn(aa[nestedKey], bb[nestedKey]);
                        }
                    }
                    else if (Array.isArray(aa)) {
                        a[key] = aa.concat(bb);
                    }
                    else if (Array.isArray(bb)) {
                        a[key] = [aa].concat(bb);
                    }
                    else {
                        for (nestedKey in bb) {
                            aa[nestedKey] = bb[nestedKey];
                        }
                    }
                }
                else {
                    a[key] = b[key];
                }
            }
            return a
        }, {});
    };
    function mergeFn(a, b) {
        return function () {
            a && a.apply(this, arguments)
            b && b.apply(this, arguments)
        }
    }
})();
describe('babel-plugin-transform-vue-jsx', function () {
    it('should contain text', function () {
        var vnode = render(function (h) { return h("div", ["test"]); });
        expect(vnode.tag).to.equal('div');
        expect(vnode.children[0].text).to.equal('test');
    });
    it('should bind text', function () {
        var text = 'foo';
        var vnode = render(function (h) { return h("div", [text]); });
        expect(vnode.tag).to.equal('div');
        expect(vnode.children[0].text).to.equal('foo');
    });
    it('should extract attrs', function () {
        var vnode = render(function (h) { return h("div", {
            attrs: {
                id: "hi",
                dir: "ltr"
            }
        }); });
        expect(vnode.data.attrs.id).to.equal('hi');
        expect(vnode.data.attrs.dir).to.equal('ltr');
    });
    it('should bind attr', function () {
        var id = 'foo';
        var vnode = render(function (h) { return h("div", {
            attrs: {
                id: id
            }
        }); });
        expect(vnode.data.attrs.id).to.equal('foo');
    });
    it('should omit attribs if possible', function () {
        var vnode = render(function (h) { return h("div", ["test"]); });
        expect(vnode.data).to.equal(undefined);
    });
    it('should omit children argument if possible', function () {
        var vnode = render(function (h) { return h("div"); });
        var children = vnode.children;
        expect(children).to.equal(undefined);
    });
    it('should handle top-level special attrs', function () {
        var vnode = render(function (h) { return (h("div", {
            class: "foo",
            style: "bar",
            key: "key",
            ref: "ref",
            refInFor: true,
            slot: "slot"
        })); });
        expect(vnode.data.class).to.equal('foo');
        expect(vnode.data.style).to.equal('bar');
        expect(vnode.data.key).to.equal('key');
        expect(vnode.data.ref).to.equal('ref');
        expect(vnode.data.refInFor).to.be.true;
        expect(vnode.data.slot).to.equal('slot');
    });
    it('should handle nested properties', function () {
        var noop = function (_) { return _; };
        var vnode = render(function (h) { return (h("div", {
            props: {
                "on-success": noop
            },
            on: {
                click: noop,
                "kebab-case": noop
            },
            domProps: {
                innerHTML: "<p>hi</p>"
            },
            hook: {
                insert: noop
            }
        })); });
        expect(vnode.data.props['on-success']).to.equal(noop);
        expect(vnode.data.on.click).to.equal(noop);
        expect(vnode.data.on['kebab-case']).to.equal(noop);
        expect(vnode.data.domProps.innerHTML).to.equal('<p>hi</p>');
        expect(vnode.data.hook.insert).to.equal(noop);
    });
    it('should handle nested properties (camelCase)', function () {
        var noop = function (_) { return _; };
        var vnode = render(function (h) { return (h("div", {
            props: {
                onSuccess: noop
            },
            on: {
                click: noop,
                camelCase: noop
            },
            domProps: {
                innerHTML: "<p>hi</p>"
            },
            hook: {
                insert: noop
            }
        })); });
        expect(vnode.data.props.onSuccess).to.equal(noop);
        expect(vnode.data.on.click).to.equal(noop);
        expect(vnode.data.on.camelCase).to.equal(noop);
        expect(vnode.data.domProps.innerHTML).to.equal('<p>hi</p>');
        expect(vnode.data.hook.insert).to.equal(noop);
    });
    it('should support data attributes', function () {
        var vnode = render(function (h) { return (h("div", {
            attrs: {
                "data-id": "1"
            }
        })); });
        expect(vnode.data.attrs['data-id']).to.equal('1');
    });
    it('should handle identifier tag name as components', function () {
        var Test = {};
        var vnode = render(function (h) { return h(Test); });
        expect(vnode.tag).to.contain('vue-component');
    });
    it('should work for components with children', function () {
        var Test = {};
        var vnode = render(function (h) { return h(Test, [h("div", ["hi"])]); });
        var children = vnode.componentOptions.children;
        expect(children[0].tag).to.equal('div');
    });
    it('should bind things in thunk with correct this context', function () {
        var Test = {
            render: function (h) {
                return h("div", [this.$slots.default]);
            }
        };
        var context = { test: 'foo' };
        var vnode = render((function (h) {
            return h(Test, [this.test]);
        }).bind(context));
        var vm = createComponentInstanceForVnode(vnode);
        var childVnode = vm._render();
        expect(childVnode.tag).to.equal('div');
        expect(childVnode.children[0].text).to.equal('foo');
    });
    it('spread (single object expression)', function () {
        var props = {
            innerHTML: 2
        };
        var vnode = render(function (h) { return (h("div", { props: props })); });
        expect(vnode.data.props.innerHTML).to.equal(2);
    });
    it('spread (mixed)', function () {
        var calls = [];
        var data = {
            attrs: {
                id: 'hehe'
            },
            on: {
                click: function () {
                    calls.push(1);
                }
            },
            props: {
                innerHTML: 2
            },
            hook: {
                insert: function () {
                    calls.push(3);
                }
            },
            class: ['a', 'b']
        };
        var vnode = render(function (h) { return (h("div", __vueJsxMergeProps([{
                attrs: {
                    href: "huhu"
                }
            }, data, {
                class: { c: true },
                on: {
                    click: function () { return calls.push(2); }
                },
                hook: {
                    insert: function () { return calls.push(4); }
                }
            }]))); });
        expect(vnode.data.attrs.id).to.equal('hehe');
        expect(vnode.data.attrs.href).to.equal('huhu');
        expect(vnode.data.props.innerHTML).to.equal(2);
        expect(vnode.data.class).to.deep.equal(['a', 'b', { c: true }]);
        // merge handlers properly for on
        vnode.data.on.click();
        expect(calls).to.deep.equal([1, 2]);
        // merge hooks properly
        vnode.data.hook.insert();
        expect(calls).to.deep.equal([1, 2, 3, 4]);
    });
    it('custom directives', function () {
        var vnode = render(function (h) { return (h("div", {
            directives: [
                { name: "test", value: 123 },
                { name: "other", value: 234 }
            ]
        })); });
        expect(vnode.data.directives.length).to.equal(2);
        expect(vnode.data.directives[0]).to.deep.equal({ name: 'test', value: 123 });
        expect(vnode.data.directives[1]).to.deep.equal({ name: 'other', value: 234 });
    });
    it('xlink:href', function () {
        var vnode = render(function (h) { return (h("use", {
            attrs: {
                "xlink:href": '#name'
            }
        })); });
        expect(vnode.data.attrs['xlink:href']).to.equal('#name');
    });
    it('merge class', function () {
        var vnode = render(function (h) { return (h("div", __vueJsxMergeProps([{
                class: "a"
            }, { class: 'b' }]))); });
        expect(vnode.data.class).to.deep.equal({ a: true, b: true });
    });
    it('h injection in object methods', function () {
        var obj = {
            method: function () {
                var h = this.$createElement;
                return h("div", ["test"]);
            }
        };
        var vnode = render(function (h) { return obj.method.call({ $createElement: h }); });
        expect(vnode.tag).to.equal('div');
        expect(vnode.children[0].text).to.equal('test');
    });
    it('h should not be injected in nested JSX expressions', function () {
        var obj = {
            method: function () {
                var h = this.$createElement;
                return h("div", {
                    attrs: {
                        foo: {
                            render: function () {
                                return h("div", ["bar"]);
                            }
                        }
                    }
                }, ["test"]);
            }
        };
        var vnode = render(function (h) { return obj.method.call({ $createElement: h }); });
        expect(vnode.tag).to.equal('div');
        var nested = vnode.data.attrs.foo.render();
        expect(nested.tag).to.equal('div');
        expect(nested.children[0].text).to.equal('bar');
    });
    it('h injection in object getters', function () {
        var obj = {
            get computed() {
                var h = this.$createElement;
                return h("div", ["test"]);
            }
        };
        var vnode = render(function (h) {
            obj.$createElement = h;
            return obj.computed;
        });
        expect(vnode.tag).to.equal('div');
        expect(vnode.children[0].text).to.equal('test');
    });
    it('h injection in multi-level object getters', function () {
        var obj = {
            inherited: {
                get computed() {
                    var h = this.$createElement;
                    return h("div", ["test"]);
                }
            }
        };
        var vnode = render(function (h) {
            obj.inherited.$createElement = h;
            return obj.inherited.computed;
        });
        expect(vnode.tag).to.equal('div');
        expect(vnode.children[0].text).to.equal('test');
    });
    it('h injection in class methods', function () {
        var Test = /** @class */ (function () {
            function Test(h) {
                this.$createElement = h;
            }
            Test.prototype.render = function () {
                var h = arguments[0];
                return h("div", ["test"]);
            };
            return Test;
        }());
        ;
        var vnode = render(function (h) { return (new Test(h)).render(h); });
        expect(vnode.tag).to.equal('div');
        expect(vnode.children[0].text).to.equal('test');
    });
    it('h injection in class getters', function () {
        var Test = /** @class */ (function () {
            function Test(h) {
                this.$createElement = h;
            }
            Object.defineProperty(Test.prototype, "computed", {
                get: function () {
                    var h = this.$createElement;
                    return h("div", ["test"]);
                },
                enumerable: true,
                configurable: true
            });
            return Test;
        }());
        ;
        var vnode = render(function (h) { return (new Test(h)).computed; });
        expect(vnode.tag).to.equal('div');
        expect(vnode.children[0].text).to.equal('test');
    });
    it('h injection in methods with parameters', function () {
        var Test = /** @class */ (function () {
            function Test(h) {
                this.$createElement = h;
            }
            Test.prototype.notRender = function (notH) {
                var h = this.$createElement;
                return h("div", [notH]);
            };
            return Test;
        }());
        ;
        var vnode = render(function (h) { return (new Test(h)).notRender('test'); });
        expect(vnode.tag).to.equal('div');
        expect(vnode.children[0].text).to.equal('test');
    });
    it('should handle special attrs properties', function () {
        var vnode = render(function (h) { return (h("input", {
            attrs: {
                value: "value"
            }
        })); });
        expect(vnode.data.attrs.value).to.equal('value');
    });
    it('should handle special domProps properties', function () {
        var vnode = render(function (h) { return (h("input", {
            domProps: {
                value: 'some jsx expression'
            }
        })); });
        expect(vnode.data.domProps.value).to.equal('some jsx expression');
    });
});
// helpers
function render(render) {
    return undefined;
}
function createComponentInstanceForVnode(vnode) {
    return undefined;
}
function describe(key, callback) { }
function it(name, callback) { }
function expect(value) {
    return {
        to: {
            equal: function (value) { },
            deep: {
                equal: function (value) { }
            },
            contain: function (value) { },
            be: {
                true: true,
                false: false
            }
        }
    };
}
;
