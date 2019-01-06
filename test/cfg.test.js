import assert from 'assert';
import {bfs, createGraph, dot} from '../src/js/cfg';
import {parseCode} from '../src/js/code-analyzer';
import {colorGraph,functionRunner} from "../src/js/colorCode";

describe('The javascript parser', () => {

    it('create graph - all process', () => {
        let code='function foo(x, y, z){ let a = x + 1; let b = a + y; let c = 0; if (b < z) { c = c + 5; } else if (b < z * 2) { c = c + x + 5; } else { c = c + z + 5; } return c; } ';
        let parsedCode = parseCode(code);
        let graph = createGraph(parsedCode);
        assert.equal(graph.length,3);
        assert.equal(graph[1].astNode.type,'ReturnStatement');
        assert.equal(graph[2].length,7);
        assert.equal(graph[2][0].label,'let a = x + 1;\nlet b = a + y;\nlet c = 0;');
        assert.equal(graph[2][1].label,'b < z');
        assert.equal(graph[2][2].label,'c = c + 5');
        assert.equal(graph[2][3].label,'return c;');
        assert.equal(graph[2][4].label,'b < z * 2');
        assert.equal(graph[2][5].label,'c = c + x + 5');
        assert.equal(graph[2][6].label,'c = c + z + 5');
    });

    it('run BFS - numbering nodes', () => {
        let code='function foo(x, y, z){ let a = x + 1; let b = a + y; let c = 0; if (b < z) { c = c + 5; } else if (b < z * 2) { c = c + x + 5; } else { c = c + z + 5; } return c; } ';
        let parsedCode = parseCode(code);
        let graph = createGraph(parsedCode);
        bfs(graph[2],1);
        assert.equal(graph.length,3);
        assert.equal(graph[1].astNode.type,'ReturnStatement');
        assert.equal(graph[2].length,7);
        assert.equal(graph[2][0].label,'#1\n a = x + 1\n b = a + y\n c = 0');
        assert.equal(graph[2][1].label,'#2\nb < z');
        assert.equal(graph[2][2].label,'#4\nc = c + 5');
        assert.equal(graph[2][3].label,'#7\nreturn c');
        assert.equal(graph[2][4].label,'#3\nb < z * 2');
        assert.equal(graph[2][5].label,'#6\nc = c + x + 5');
        assert.equal(graph[2][6].label,'#5\nc = c + z + 5');
    });

    it('run DOT graph - if', () => {
        let code='function foo(x, y, z){ let a = x + 1; let b = a + y; let c = 0; if (b < z) { c = c + 5; } else if (b < z * 2) { c = c + x + 5; } else { c = c + z + 5; } return c; } ';
        let parsedCode = parseCode(code);
        let graph = createGraph(parsedCode);
        graph[2] = colorGraph(graph[2],parsedCode,'1,2,3');
        bfs(graph[2],1);// numbering graph
        let expected = 'n0 [label="#1\n' +
            ' a = x + 1\n' +
            ' b = a + y\n' +
            ' c = 0" style = "filled" fillcolor = "green" shape="box"]\n' +
            'n1 [label="#2\n' +
            'b < z" style = "filled" fillcolor = "green" shape="diamond"]\n' +
            'n2 [label="#4\n' +
            'c = c + 5" shape="box"]\n' +
            'n3 [label="#7\n' +
            'return c" style = "filled" fillcolor = "green" shape="box"]\n' +
            'n4 [label="#3\n' +
            'b < z * 2" style = "filled" fillcolor = "green" shape="diamond"]\n' +
            'n5 [label="#6\n' +
            'c = c + x + 5" style = "filled" fillcolor = "green" shape="box"]\n' +
            'n6 [label="#5\n' +
            'c = c + z + 5" shape="box"]\n' +
            'n0 -> n1 []\n' +
            'n1 -> n2 [label="true"]\n' +
            'n1 -> n4 [label="false"]\n' +
            'n2 -> n3 []\n' +
            'n4 -> n5 [label="true"]\n' +
            'n4 -> n6 [label="false"]\n' +
            'n5 -> n3 []\n' +
            'n6 -> n3 []\n';
        assert.equal(dot(graph),expected);
    });

    it('run DOT graph - if inside if', () => {
        let code='function foo(x) { let a = 0; let b = 1; if (x == 2) { x = 2; if (x == 2) { a = a; } else if (x == 1) { b = b; } let f = 1; b = f; } else if (x == 1) { x = x } else { a = a } return 3; }';
        let parsedCode = parseCode(code);
        let graph = createGraph(parsedCode);
        graph[2] = colorGraph(graph[2],parsedCode,'2');
        assert.equal(graph.length,3);
        assert.equal(graph[1].astNode.type,'ReturnStatement');
        assert.equal(graph[2].length,12);
        assert.equal(graph[2][0].color,true);
        assert.equal(graph[2][1].color,true);
        assert.equal(graph[2][2].color,true);
        assert.equal(graph[2][3].color,true);
        assert.equal(graph[2][4].color,true);
        assert.equal(graph[2][5].color,true);
        assert.equal(graph[2][6].color,true);
        assert.equal(graph[2][7].color,undefined);
        assert.equal(graph[2][8].color,undefined);
        assert.equal(graph[2][9].color,undefined);
        assert.equal(graph[2][10].color,undefined);
        assert.equal(graph[2][10].color,undefined);


    });

    it('while without arguments', () => {
        let code='function foo(x, y, z){ let a = x + 1; let b = a + y; let c = 0; while (a < z) { c = a + b; z = c * 2; a++; } return z; } ';
        let parsedCode = parseCode(code);
        let graph = createGraph(parsedCode);
        graph[2] = colorGraph(graph[2],parsedCode,'');
        assert.equal(graph.length,3);
        assert.equal(graph[1].astNode.type,'ReturnStatement');
        assert.equal(graph[2].length,4);
        assert.equal(graph[2][0].color,undefined);
        assert.equal(graph[2][1].color,undefined);
        assert.equal(graph[2][2].color,undefined);
        assert.equal(graph[2][3].color,undefined);
        assert.equal(graph[2][0].label,'let a = x + 1;\nlet b = a + y;\nlet c = 0;');
        assert.equal(graph[2][1].label,'a < z');
        assert.equal(graph[2][2].label,'c = a + b\nz = c * 2\na++');
        assert.equal(graph[2][3].label,'return z;');


    });

    it('while with arguments', () => {
        let code='function foo(x, y){ let a; let c = 0; a=c+x; while (c < y) { y--; a--; } return a; }';
        let parsedCode = parseCode(code);
        let graph = createGraph(parsedCode);
        graph[2] = colorGraph(graph[2],parsedCode,'1,2');
        assert.equal(graph.length,3);
        assert.equal(graph[1].astNode.type,'ReturnStatement');
        assert.equal(graph[2].length,4);
        assert.equal(graph[2][0].color,true);
        assert.equal(graph[2][1].color,true);
        assert.equal(graph[2][2].color,true);
        assert.equal(graph[2][3].color,true);
        assert.equal(graph[2][0].label,'let a;\nlet c = 0;\na = c + x');
        assert.equal(graph[2][1].label,'c < y');
        assert.equal(graph[2][2].label,'y--\na--');
        assert.equal(graph[2][3].label,'return a;');


    });

    it('array as global', () => {
        let code='function foo(x,y){ let a= x[0]; x[2]=7; if(x[0]==1) a++; return y; }';
        let parsedCode = parseCode(code);
        let graph = createGraph(parsedCode);
        graph[2] = colorGraph(graph[2],parsedCode,'[1,2,3],1');
        bfs(graph[2],1);// numbering graph
        let expected = 'n0 [label="#1\n' +
            ' a = x[0]\n' +
            'x[2] = 7" style = "filled" fillcolor = "green" shape="box"]\n' +
            'n1 [label="#2\n' +
            'x[0] == 1" style = "filled" fillcolor = "green" shape="diamond"]\n' +
            'n2 [label="#4\n' +
            'a++" style = "filled" fillcolor = "green" shape="box"]\n' +
            'n3 [label="#3\n' +
            'return y" style = "filled" fillcolor = "green" shape="box"]\n' +
            'n0 -> n1 []\n' +
            'n1 -> n2 [label="true"]\n' +
            'n1 -> n3 [label="false"]\n' +
            'n2 -> n3 []\n';
        assert.equal(dot(graph),expected);

    });

    it('array as local', () => {
        let code='function foo(x, y, z){ z++; if(z==4){ let a = [x,y,z]; a[0]=5; } return a; }';
        let parsedCode = parseCode(code);
        let graph = createGraph(parsedCode);
        graph[2] = colorGraph(graph[2],parsedCode,'1,2,3');
        bfs(graph[2],1);// numbering graph
        let expected = 'n0 [label="#1\n' +
            'z++" style = "filled" fillcolor = "green" shape="box"]\n' +
            'n1 [label="#2\n' +
            'z == 4" style = "filled" fillcolor = "green" shape="diamond"]\n' +
            'n2 [label="#4\n' +
            ' a = [\n' +
            '    x,\n' +
            '    y,\n' +
            '    z\n' +
            ']\n' +
            'a[0] = 5" style = "filled" fillcolor = "green" shape="box"]\n' +
            'n3 [label="#3\n' +
            'return a" style = "filled" fillcolor = "green" shape="box"]\n' +
            'n0 -> n1 []\n' +
            'n1 -> n2 [label="true"]\n' +
            'n1 -> n3 [label="false"]\n' +
            'n2 -> n3 []\n';
        assert.equal(dot(graph),expected);

    });

    it('sequence declarations', () => {
        let code='function foo(x){ let a,b,c; a=0,b=x; if(a==b) c=8; return c; } ';
        let parsedCode = parseCode(code);
        let graph = createGraph(parsedCode);
        graph[2] = colorGraph(graph[2],parsedCode,'0');
        bfs(graph[2],1);// numbering graph
        let expected = 'n0 [label="#1\n' +
            ' a, b, c\n' +
            'a = 0, b = x" style = "filled" fillcolor = "green" shape="box"]\n' +
            'n1 [label="#2\n' +
            'a == b" style = "filled" fillcolor = "green" shape="diamond"]\n' +
            'n2 [label="#4\n' +
            'c = 8" style = "filled" fillcolor = "green" shape="box"]\n' +
            'n3 [label="#3\n' +
            'return c" style = "filled" fillcolor = "green" shape="box"]\n' +
            'n0 -> n1 []\n' +
            'n1 -> n2 [label="true"]\n' +
            'n1 -> n3 [label="false"]\n' +
            'n2 -> n3 []\n';
        assert.equal(dot(graph),expected);

    });

    it('arrays check', () => {
        let code='function foo(x){ let a=[2,3,4]; if(a[2]<=x[2]) a[2] = a[2]+1; return a; } ';
        let parsedCode = parseCode(code);
        let graph = createGraph(parsedCode);
        graph[2] = colorGraph(graph[2],parsedCode,'[4,5,6]');
        bfs(graph[2],1);// numbering graph
        let expected = 'n0 [label="#1\n' +
            ' a = [\n' +
            '    2,\n' +
            '    3,\n' +
            '    4\n' +
            ']" style = "filled" fillcolor = "green" shape="box"]\n' +
            'n1 [label="#2\n' +
            'a[2] <= x[2]" style = "filled" fillcolor = "green" shape="diamond"]\n' +
            'n2 [label="#4\n' +
            'a[2] = a[2] + 1" style = "filled" fillcolor = "green" shape="box"]\n' +
            'n3 [label="#3\n' +
            'return a" style = "filled" fillcolor = "green" shape="box"]\n' +
            'n0 -> n1 []\n' +
            'n1 -> n2 [label="true"]\n' +
            'n1 -> n3 [label="false"]\n' +
            'n2 -> n3 []\n';
        assert.equal(dot(graph),expected);

    });

    it('Not supported function', () => {
        let parseCode = {
            "type": "NotSupported",
            "id": {
                "type": "Identifier",
                "name": "sample"
            },
            "params": [],
            "body": {
                "type": "BlockStatement",
                "body": []
            }
        };
        assert.equal(functionRunner(parseCode), null);
    });

    it('if after while', () => {
        let code='function foo(x){ let i = 1; while(i < 3) { i = i + 1; } if(i === 1) x++; return x; } ';
        let parsedCode = parseCode(code);
        let graph = createGraph(parsedCode);
        graph[2] = colorGraph(graph[2],parsedCode,'1');
        bfs(graph[2],1);// numbering graph
        let expected = 'n0 [label="#1\n' +
            ' i = 1" style = "filled" fillcolor = "green" shape="box"]\n' +
            'n1 [label="#2\n' +
            'i < 3" style = "filled" fillcolor = "green" shape="diamond"]\n' +
            'n2 [label="#4\n' +
            'i = i + 1" style = "filled" fillcolor = "green" shape="box"]\n' +
            'n3 [label="#3\n' +
            'i === 1" style = "filled" fillcolor = "green" shape="diamond"]\n' +
            'n4 [label="#6\n' +
            'x++" shape="box"]\n' +
            'n5 [label="#5\n' +
            'return x" style = "filled" fillcolor = "green" shape="box"]\n' +
            'n0 -> n1 []\n' +
            'n1 -> n2 [label="true"]\n' +
            'n1 -> n3 [label="false"]\n' +
            'n2 -> n1 []\n' +
            'n3 -> n4 [label="true"]\n' +
            'n3 -> n5 [label="false"]\n' +
            'n4 -> n5 []\n' ;
        assert.equal(dot(graph),expected);

    });

    it('2D array', () => {
        let code='function foo(x) { let m = [1,2]; let n = [4,5]; x = x + n[m[0]]; return x; }';
        let parsedCode = parseCode(code);
        let graph = createGraph(parsedCode);
        graph[2] = colorGraph(graph[2],parsedCode,'1');
        bfs(graph[2],1);// numbering graph
        let expected = 'n0 [label="#1\n' +
            ' m = [\n' +
            '    1,\n' +
            '    2\n' +
            ']\n' +
            ' n = [\n' +
            '    4,\n' +
            '    5\n' +
            ']\n' +
            'x = x + n[m[0]]" style = "filled" fillcolor = "green" shape="box"]\n' +
            'n1 [label="#2\n' +
            'return x" style = "filled" fillcolor = "green" shape="box"]\n' +
            'n0 -> n1 []\n';
        assert.equal(dot(graph),expected);

    });

    it('while and if', () => {
        let code='function foo(x) { let a = 0; let b = 1; while (x == 2) { if (x == 1) { while (x == 1) { if (x == 1) { x = x } else if (x == 1) { a = a } } } else { while (x == 2) { if (x == 1) { x = x } else if (x == 2) { a = a } } } } return 3; }';
        let parsedCode = parseCode(code);
        let graph = createGraph(parsedCode);
        graph[2] = colorGraph(graph[2],parsedCode,'1');
        bfs(graph[2],1);// numbering graph
        let expected = 'n0 [label="#1\n' +
            ' a = 0\n' +
            ' b = 1" style = "filled" fillcolor = "green" shape="box"]\n' +
            'n1 [label="#2\n' +
            'x == 2" style = "filled" fillcolor = "green" shape="diamond"]\n' +
            'n2 [label="#4\n' +
            'x == 1" shape="diamond"]\n' +
            'n3 [label="#6\n' +
            'x == 1" shape="diamond"]\n' +
            'n4 [label="#8\n' +
            'x == 1" shape="diamond"]\n' +
            'n5 [label="#12\n' +
            'x = x" shape="box"]\n' +
            'n6 [label="#11\n' +
            'x == 1" shape="diamond"]\n' +
            'n7 [label="#14\n' +
            'a = a" shape="box"]\n' +
            'n8 [label="#5\n' +
            'x == 2" shape="diamond"]\n' +
            'n9 [label="#7\n' +
            'x == 1" shape="diamond"]\n' +
            'n10 [label="#10\n' +
            'x = x" shape="box"]\n' +
            'n11 [label="#9\n' +
            'x == 2" shape="diamond"]\n' +
            'n12 [label="#13\n' +
            'a = a" shape="box"]\n' +
            'n13 [label="#3\n' +
            'return 3" style = "filled" fillcolor = "green" shape="box"]\n' +
            'n0 -> n1 []\n' +
            'n1 -> n2 [label="true"]\n' +
            'n1 -> n13 [label="false"]\n' +
            'n2 -> n3 [label="true"]\n' +
            'n2 -> n8 [label="false"]\n' +
            'n3 -> n4 [label="true"]\n' +
            'n3 -> n1 [label="false"]\n' +
            'n4 -> n5 [label="true"]\n' +
            'n4 -> n6 [label="false"]\n' +
            'n5 -> n3 []\n' +
            'n6 -> n7 [label="true"]\n' +
            'n6 -> n3 [label="false"]\n' +
            'n7 -> n3 []\n' +
            'n8 -> n9 [label="true"]\n' +
            'n8 -> n1 [label="false"]\n' +
            'n9 -> n10 [label="true"]\n' +
            'n9 -> n11 [label="false"]\n' +
            'n10 -> n8 []\n' +
            'n11 -> n12 [label="true"]\n' +
            'n11 -> n8 [label="false"]\n' +
            'n12 -> n8 []\n';
        assert.equal(dot(graph),expected);

    });


});