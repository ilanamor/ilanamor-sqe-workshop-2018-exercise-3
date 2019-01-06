import $ from 'jquery';
import {parseCode} from './code-analyzer';
import {createGraph, bfs, dot} from './cfg';
import {colorGraph} from './colorCode';
import * as Viz from 'viz.js';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        reset();
        let codeToParse = $('#codePlaceholder').val();
        let args = $('#argsPlaceholder').val();
        let parsedCode = parseCode(codeToParse);
        let cfg = createGraph(parsedCode);
        cfg[2] = colorGraph(cfg[2],parsedCode,args);
        bfs(cfg[2],1);// numbering graph
        let dotCFG = dot(cfg);
        let vizu = Viz('digraph { ' + dotCFG + ' }'); //viz graph
        drawGraph(vizu);

    });
});

function reset(){
    let graph = document.getElementById('svg');
    while (graph.firstChild) {
        graph.removeChild(graph.firstChild);
    }
}

function drawGraph(vizu){
    let element = document.createElement('div');
    element.innerHTML = vizu;
    document.getElementById('svg').appendChild(element);
}