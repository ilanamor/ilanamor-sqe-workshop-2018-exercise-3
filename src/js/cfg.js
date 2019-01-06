import * as escodegen from 'escodegen';
import * as esprima from 'esprima';
const esgraph = require('esgraph');


function createGraph(parseCode){
    let functionBody = parseCode.body[0].body;
    let cfg = esgraph(functionBody);
    cfg[2] = removeExceptions(cfg[2]);
    cfg = removeBorders(cfg);
    cfg[2] = findNodesToJoin(cfg[2]);
    return cfg;
}

function removeExceptions(cfg){
    cfg.forEach(function(element) {
        delete element.exception;
    });
    return cfg;
}

function removeBorders(code){
    let cfg = code[2];
    let exit = cfg[cfg.length-1];
    let retNode = null;
    exit.prev.forEach(function(element){
        if (element.astNode.type === 'ReturnStatement')
            retNode = element;
        else
            element.next = element.next.slice(1);
    });
    cfg[0].normal.type = 'entry';
    cfg[0].normal.prev = [];
    retNode.type = 'exit';
    retNode.next = [];
    delete retNode.normal;
    code[1] = retNode;
    code[2] = cfg.slice(1, cfg.length - 1);
    return code;
}

/*function removeBorders(cfg){
    let exit = cfg[cfg.length-1];
    let ret = null;
    exit.prev.forEach(function(element){
        if (element.astNode.type === 'ReturnStatement')
            ret = element;
        else
            element.next.slice(1);
    });
    cfg[0].normal.type = 'entry';
    cfg[0].normal.prev = [];
    ret.type = 'exit';
    ret.next = [];
    delete ret.normal;
    return cfg.slice(1, cfg.length - 1);
}*/

function findNodesToJoin(cfg){
    let nodes = addLabels(cfg);
    for(let i=0; i<nodes.length; i++){
        let node = nodes[i];
        if (condition(node)){
            let nextNode = node.normal;
            nodes[i] = joinNodes(node,nextNode);
            nodes.splice(nodes.indexOf(nextNode), 1);
            i--;
        }
    }
    return nodes;
}

function condition(node){
    return node.normal && node.normal.normal && node.normal.prev.length === 1;
}

function addLabels(nodes){
    nodes.forEach(function(element){
        element.label = escodegen.generate(element.astNode);
    });
    return nodes;
}

function joinNodes(node,nextNode){
    node.normal = nextNode.normal;
    node.next = nextNode.next;
    node.label += '\n' + nextNode.label;
    node.astNode = esprima.parseScript(node.label, {range:true});
    return node;
}

/*function addMergeNodes(cfg){
    cfg.forEach(function(element) {
        if(element.prev.length>1){
            let fn = {prev:element.prev, merge:true, label:'',next:[element], normal:element};
            cfg.push(fn);
            element.prev.forEach(function(p) {
                p.next = [fn];
                p.normal = fn;
            });
            element.prev=fn;
        }
    });
    return cfg;
}*/

function handleLabel(node,i){
    return ('#'+i+'\n'+ node.replace(/let/g,'').replace(/;/g,''));
}

function handleBfsNode(node,i,listToExplore){
    if (!node.visited) {
        node.visited = true;
        i++;
        node.label = handleLabel(node.label,i);
        listToExplore.push(node);
    }
    return listToExplore, i;
}

function bfs(cfg,i) {
    let node = cfg[0];
    let listToExplore = [ node ];
    node.visited = true;
    node.label = handleLabel(node.label,i);

    while ( listToExplore.length > 0 ) {
        node = listToExplore.shift();
        if(node.normal) {
            listToExplore,i = handleBfsNode(node.normal,i,listToExplore);
        }
        else if (node.type ==='exit') {
            continue;
        }
        else {
            listToExplore,i = handleBfsNode(node.false,i,listToExplore);
            listToExplore,i = handleBfsNode(node.true,i,listToExplore);
        }
    }
}

//based on the dot function exist in esGraph
function dot(cfg){
    const output = [];
    dotNodes(cfg[2], output);
    dotEdges(cfg[2], output);
    return output.join('');
}

function dotNodes(nodes,output){
    // print all the nodes:
    for (const [i, node] of nodes.entries()) {
        output.push(`n${i} [label="${node.label}"`);
        if (node.color)
            output.push(' style = "filled" fillcolor = "green"');
        if (node.true || node.false)
            output.push(' shape="diamond"]\n');
        /*else if(node.merge)
            output.push(' shape="circle"]\n');*/
        else
            output.push(' shape="box"]\n');

    }

    return output;
}

function dotEdges(nodes,output){
    // print all the edges:
    for (const [i, node] of nodes.entries()) {
        for (const type of ['normal', 'true', 'false', 'exception']) {
            const next = node[type];
            if (!next) continue;
            output.push(`n${i} -> n${nodes.indexOf(next)} [`);
            if (['true', 'false'].includes(type)) output.push(`label="${type}"`);
            output.push(']\n');
        }
    }
    return output;
}

export {createGraph, bfs, dot};