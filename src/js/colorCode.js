import * as escodegen from 'escodegen';
import {parseCode} from './code-analyzer';

let globals=new Map();
let locals = new Map();
let inputArgs = new Array();
let first=1;

function colorGraph(cfg, parsedCode, args){
    reset();
    if(args==='') return cfg;
    getArgs(args);
    functionDeclaration(parsedCode,1); //handel lets
    first=0;
    let element = cfg[0];
    while(element.type !== 'exit'){
        element.color = true;
        if(element.normal){
            functionRunner(parseCode(element.label),locals);
            element = element.normal;
        }
        else if(functionRunner(parse(element.label),locals))
            element = element.true;
        else element = element.false;
    }
    element.color = true; //return statement always green
    return cfg;
}

function parse(expression){
    return parseCode(expression).body[0].expression;
}

function functionDeclaration(parsedCode){
    let code = parsedCode.body[0];
    functionRunner(code, locals,first);
}

var typeToHandlerMapping = {
    'Program': blockStatementHandler,
    'FunctionDeclaration': functionDeclarationHandler,
    'VariableDeclaration': variableDeclarationHandler,
    'ExpressionStatement': expressionStatementHandler,
    'BlockStatement': blockStatementHandler,
    'AssignmentExpression': assignmentDeclaration,
    'UpdateExpression': updateDeclaration,
    'BinaryExpression': binaryExpression,
    'LogicalExpression': binaryExpression

};

function reset(){
    globals=new Map();
    locals = new Map();
    inputArgs = new Array();
    first=1;
}

function getArgs(args){
    let tmp = args.split(',');
    let arrInput = new Array();
    for(let i=0; i<tmp.length;i++) {
        if(tmp[i].startsWith('[')){
            arrInput = new Array();
            arrInput.push(tmp[i].substring(1));
            i++;
            while(tmp[i].endsWith(']')===false){
                arrInput.push(tmp[i]);
                i++;
            }
            arrInput.push(tmp[i].substring(0,tmp[i].length-1));
            inputArgs.push(arrInput);
        }
        else inputArgs.push(tmp[i]);
    }
}

function functionRunner(program,locals) {
    let name= program.type;
    let func = typeToHandlerMapping[name];
    return func ? func.call(undefined, program,locals) : null;
}

function functionDeclarationHandler(declaration, locals) {
    params(declaration.params);
    declaration.body = functionRunner(declaration.body,locals);
    return declaration;
}

function params(params) {
    let i=0;
    params.forEach(function(element) {
        globals.set(element.name, inputArgs[i]);
        i++;
    });
}

function blockStatementHandler(block,locals) {
    if(first===1){
        block.body.forEach(function(element) {
            if(element.type==='VariableDeclaration') {
                functionRunner(element,locals);
            }
        });
    }
    else{
        block.body.forEach(function(element) {
            // if(element.type==='VariableDeclaration' || element.type==='ExpressionStatement') {
            //     functionRunner(element,locals);
            // }
            functionRunner(element,locals);
        });
    }

}

function checkLocals(param,locals){
    if (locals.size>0)
        return locals.has(param.name) ? locals.get(param.name) : param;
    else return param;
}

function variableDeclarationHandler(declaration,locals) {
    declaration.declarations.forEach(function(element) {
        variableDeclarator(element,locals);
    });
}

function expressionStatementHandler(declaration,locals) {
    if(declaration.expression.type=='SequenceExpression'){
        let result = [];
        declaration.expression.expressions.forEach(function(element) {
            result.push(checkExpression(element,locals));
        });
        declaration.expression.expressions=result;
    }
    else
        declaration.expression = checkExpression(declaration.expression,locals);
    return declaration;
}

function variableDeclarator(element,locals){
    if(element.init==null)
        locals.set(element.id.name, '\'\'');
    else
        locals.set(element.id.name, expressionDeclaration(element.init, locals));
    return locals;
}

function checkExpression(expression,locals){
    if(expression.type=='AssignmentExpression')
        return assignmentDeclaration(expression,locals);
    else //if(expression.type=='UpdateExpression')
        return updateDeclaration(expression,locals);
}

function updateDeclaration(expression,locals){
    //let val = expressionDeclaration(expression.argument,locals);
    if(globals.has(expression.argument.name)===true){
        //expression.argument = expressionDeclaration(expression.argument,locals);
        if(expression.operator=='++')
            globals.set(expression.argument.name,calculate(globals.get(expression.argument.name)+ '+1'));
        else
            globals.set(expression.argument.name,calculate(globals.get(expression.argument.name)+ '-1'));
    }
    else /*if ((locals.has(expression.argument.name)===true))*/{
        if(expression.operator=='++')
            locals.set(expression.argument.name,parse(escodegen.generate(locals.get(expression.argument.name))+ '+1'));
        else
            locals.set(expression.argument.name,parse(escodegen.generate(locals.get(expression.argument.name))+ '-1'));
    } //else return;
    return expression;
}

function assignmentDeclaration(expression,locals){

    if(expression.left.type==='MemberExpression' && expression.left.computed===true){
        setArray(expression,locals);
    }
    else {
        expression.right = expressionDeclaration(expression.right, locals);

        if (locals.has(expression.left.name))
            locals.set(expression.left.name, expression.right);
        if (globals.has(expression.left.name))
            globals.set(expression.left.name, calculate(escodegen.generate(expression.right)));
    }
    return expression;
}

function setArray(expression,locals){
    let arr = expression.left.object.name;
    let index = escodegen.generate(expressionDeclaration(expression.left.property,locals));
    if(locals.has(arr))
        locals.get(arr)[index]=expressionDeclaration(expression.right,locals);
    else /*if(globals.has(arr))*/
        globals.get(arr)[index]=calculate(escodegen.generate(expressionDeclaration(expression.right,locals)));
    //else return expression;

}

function expressionDeclaration(expression,locals){
    if (expression.type=='Identifier'){
        expression = checkLocals(expression,locals);
        return expression;
    }
    else if(expression.type=='Literal')
        return expression;
    else
        return singleCharExpression(expression,locals);
}

function singleCharExpression(expression,locals){
    /*if(expression.type=='UpdateExpression' || expression.type=='UnaryExpression'){
        expression.argument= expressionDeclaration(expression.argument,locals);
        return expression;
    }
    else*/ if(expression.type=='MemberExpression')
        return memberExpression(expression,locals);
    else
        return ComplexExpression(expression,locals);
}

function ComplexExpression(expression,locals){
    if(expression.type=='ArrayExpression')
        return arrayExpression(expression.elements,locals);
    else { /*(expression.type=='LogicalExpression' || expression.type=='BinaryExpression' || expression.type=='AssignmentExpression')*/
        expression.left=expressionDeclaration(expression.left,locals);
        expression.right=expressionDeclaration(expression.right,locals);
        return expression;
    }
}

function arrayExpression(expression,locals){
    let answer = [];
    expression.forEach(function(element) {
        answer.push(expressionDeclaration(element,locals));
    });
    return answer;
}

function memberExpression(expression,locals) {
    if(expression.property.type == 'MemberExpression'){
        expression.property = memberExpression(expression.property,locals);
    }
    else{
        expression.property= expressionDeclaration(expression.property,locals);
    }

    return getValue(expression,locals);
}

function getValue(expression,locals){
    let arr = expression.object.name;
    let index = escodegen.generate(expressionDeclaration(expression.property));
    if(locals.has(arr))
        return locals.get(arr)[index];
    else return expression;

}

function binaryExpression(expression,locals){
    let test = expressionDeclaration(expression,locals);
    return checkCondition(test);
}

function checkCondition(condition){
    let code = '(function test('+ Array.from(globals.keys()).join() + ') { return '+ escodegen.generate(condition) + '; })(' + /*Array.from(globals.values()).join()*/getArgsAsString() + ')';
    return eval(code);
}

function getArgsAsString(){
    let arr = Array.from(globals.values());
    let result = '';
    arr.forEach(function(element){
        if(element.constructor === Array)
            result += '[' + element.join() + '],';
        else
            result += element + ',';
    });

    return result.slice(0, -1);
}

function calculate(calculation){
    let code = '(function test('+ Array.from(globals.keys()).join() + ') { return '+ calculation + '; })(' + Array.from(globals.values()).join() + ')';
    return eval(code).toString();
}

export {functionDeclaration,reset,globals,calculate,functionRunner,colorGraph};