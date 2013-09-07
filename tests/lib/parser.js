var should = require('should');
var Parser = process.env.L20N_COV
  ? require('../../build/cov/lib/l20n/parser').Parser
  : require('../../lib/l20n/parser').Parser;

describe('Example', function() {
  var parser;
  beforeEach(function() {
    parser = new Parser();
  });

  it('string value', function() {
    var ast = parser.parse("id = string");
    should.not.exist(ast.body['id'].type);
    ast.body['id'].value.content.should.equal('string');
  });
  it('basic errors', function() {
    var strings = [
      "",
      "id",
      "id ",
      "id =",
      "+id",
      "=id",
    ];

    for (var i in strings) {
      var ast = parser.parse(strings[i]);
      Object.keys(ast.body).length.should.equal(0);
    }
  });
  it('basic attributes', function() {
    var ast = parser.parse("id.attr1 = foo");
    ast.body['id'].attrs['attr1'].value.content.should.equal('foo');
  });
  it('plural macro', function() {
    var ast = parser.parse("id = {[ plural(m) ]} \nid[one] = foo");
    ast.body['id'].value.type.should.equal('Hash');
    ast.body['id'].value.content[0].type.should.equal('HashItem');
    ast.body['id'].value.content[0].value.content.should.equal('foo');
    ast.body['id'].index.length.should.equal(1);
    ast.body['id'].index[0].type.should.equal('CallExpression');
    ast.body['id'].index[0].callee.type.should.equal('Identifier');
    ast.body['id'].index[0].callee.name.should.equal('plural');
    ast.body['id'].index[0].arguments.length.should.equal(1);
    ast.body['id'].index[0].arguments[0].type.should.equal('Identifier');
    ast.body['id'].index[0].arguments[0].name.should.equal('m');
  });
  it('plural macro errors', function() {
    var strings = [
      'id = {[ plural(m) ] \nid[one] = foo',
      'id = {[ plural(m) \nid[one] = foo',
      'id = { plural(m) ]} \nid[one] = foo',
      'id = plural(m) ]} \nid[one] = foo',
      'id = {[ m ]} \nid[one] = foo',
      'id = {[ plural ]} \nid[one] = foo',
      'id = {[ plural() ]} \nid[one] = foo',
      'id = {[ plural(m ]} \nid[one] = foo',
      'id = {[ pluralm) ]} \nid[one] = foo',
      'id = {[ watch(m) ]} \nid[one] = foo',

    ];
    for (var i in strings) {
      (function() {
        var ast = parser.parse(strings[i]);
      }).should.throw('Expected macro call')
    } 
  });
  it('comment', function() {
    var ast = parser.parse('#test');
    Object.keys(ast.body).length.should.equal(0);
  });
  it('comment errors', function() {
    var strings = [
      ' # foo',
      ' ## foo',
      'f# foo',
    ];
    for (var i in strings) {
      var ast = parser.parse(strings[i]);
      Object.keys(ast.body).length.should.equal(0);
    }  
  });
  it('complex string', function() {
    var ast = parser.parseString("test {{ var }} test2");
    ast.content[0].content.should.equal('test ');
    ast.content[1].name.should.equal('var');
    ast.content[2].content.should.equal(' test2');

    var ast = parser.parseString("test \\\" {{ var }} test2");
    ast.content[0].content.should.equal('test " ');
    ast.content[1].name.should.equal('var');
    ast.content[2].content.should.equal(' test2');
  });
  it('complex string errors', function() {
    var strings = [
      ['test {{ var ', 'Expected "}}"'],
      ['test {{ var } ', 'Expected "}}"'],
      ['test {{ var } }', 'Expected "}}"'],
      ['test {{ var }} {{', 'Expected "}}"'],
      ['test {{ var }} {{}', 'Expected "}}"'],
      ['test {{ {{ }}', 'Expected "}}"'],
      ['test {{ {{ } }}', 'Expected "}}"'],
      ['test {{ {{ } }}}', 'Expected "}}"'],
      ['test {{{ }', 'Expected "}}"'],
    ];
    for (var i in strings) {
      (function() {
        var ast = parser.parseString(strings[i][0]);
      }).should.throw(strings[i][1]);
    }  
  });
  describe('detecting non-complex (simple) strings', function() {
    it('should return not-complex for simple strings', function() {
      var ast = parser.parse("id = string");
      should.not.exist(ast.body['id'].maybeComplex);
    });
    it('should return maybe-complex for complex strings', function() {
      var ast = parser.parse("id = {{ reference }}");
      ast.body['id'].value.maybeComplex.should.equal(true);
    });
  });
});
