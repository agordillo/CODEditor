CODEditor.Samples = (function(C,$,undefined){

	/* Example 1*/
	var js_sample_score = function(result){
		if(result=='Hello World'){
			return 10;
		} else {
			return 0;
		}
	};

	var js_sample = {
		"type": "exercise",
		"title": "Hello World con JavaScript",
		"description":"Escriba 'Hello World'.",
		"editorMode":"JavaScript",
		"content": "/*\n * Escriba \"Hello World\" y ejecute el código.\n */\n ",
		"score_function": ("var score = " + js_sample_score.toString())
	};


	/* Example 2*/
	var js_sample_feedback_score = function(result){
		var grade = {};
		grade.successes = [];
		grade.errors = [];
		grade.feedback = [];

		if(result=='Hello World'){
			grade.score = 10;
			grade.successes.push("Escribiste bien 'Hello World'.");
			grade.feedback.push("¡Muy bien!");
		} else if((typeof result == "string")&&(result.toLowerCase()==='Hello World'.toLowerCase())){
			grade.score = 5;
			grade.successes.push("Escribiste 'Hello World'.");
			grade.feedback.push("Recuerda que JavaScript es sensible a maýusculas. No es lo mismo 'Hello World' que 'HELLO WORLD'.");
		} else {
			grade.score = 0;
			grade.errors.push("El valor devuelto no era exactamente 'Hello World'.");
			grade.feedback.push("Debe escribir \"Hello World\" o 'Hello World' y ejecutar el código.");
		}
		return grade;
	};

	var js_sample_feedback = {
		"type": "exercise",
		"title": "Hello World con feedback en JavaScript",
		"description":"Escriba 'Hello World'.",
		"editorMode":"JavaScript",
		"content": "/*\n * Escriba \"Hello World\" y ejecute el código.\n */\n ",
		"score_function": ("var score = " + js_sample_feedback_score.toString())
	};


	/* Example 3*/
	var js_sample_multivar_score = function(result,variablesHash){
		var grade = {};
		grade.successes = [];
		grade.errors = [];
		grade.feedback = [];
		grade.score = 0;

		var a = variablesHash["a"];
		var b = variablesHash["b"];

		if(typeof a !== "string"){
			grade.errors.push("El valor devuelto en la variable 'a' no es una string.");
		} else {
			grade.score += 1;
			if(a==='Hello World'){
				grade.successes.push("Se definió 'Hello World' en la variable 'a'.");
				grade.score += 1;
			}
		}

		if(typeof b !== "function"){
			grade.errors.push("El valor devuelto en la variable 'b' no es una función.");
		} else {
			grade.score += 1;

			//Testear la función.
			try {
				var testA = b("Perro");
				if(testA==="perro"){
					grade.score += 2;
					grade.successes.push("La función definida en 'b' funciona correctamente para palabras simples.");
				} else {
					grade.errors.push("La función definida en 'b' no funciona correctamente para palabras simples.");
				}

				try {
					b(undefined);
					b(null);
					b(8);
					var testB = b("");
					if(typeof testB !== "undefined"){
						grade.score += 2;
						grade.successes.push("La función definida en 'b' gestiona correctamente valores de entrada erróneos.");
					}
				} catch(e){
					grade.errors.push("La función definida en 'b' no gestiona correctamente valores de entrada erróneos.");
					grade.feedback.push("Recuerde tomar en consideración los casos en los que la variable de entrada de una función pueda ser 'undefined', 'null', u otros valores no esperados.");
				}

				try {
					var testC = b("Mi Gato COME cOmIdA de gat0");
					if(testC === "mi gato come comida de gat0"){
						grade.score += 3;
						grade.successes.push("La función definida en 'b' funciona correctamente para frases.");
					} else {
						grade.errors.push("La función definida en 'b' no funciona correctamente para frases.");
					}
				} catch(e) {
					grade.errors.push("La función definida en 'b' no gestiona correctamente valores de entrada erróneos.");
					grade.feedback.push("Recuerde tomar en consideración los casos en los que la variable de entrada de una función pueda ser 'undefined', 'null', u otros valores no esperados.");
				}

			} catch(e) {
				grade.errors.push("La función 'b' presenta errores de ejecución.");
			}
		}

		//Scale grade
		grade.score = Math.min(10,Math.max(0,Math.pow(grade.score,2)/10) + 0.1);


		if(grade.score===10){
			grade.feedback.push("¡Enhorabuena, tu solución es perfecta!");
		}


		return grade;
	};

	var js_sample_multivar = {
		"type": "exercise",
		"title": "Ejercicio con varias variables",
		"description":"Devuelva en la variable <b>'a'</b> la palabra 'Hello World', y en la variable <b>'b'</b> una función que reciba como parámetro una string y la pase a minúsculas.",
		"editorMode":"JavaScript",
		"content": "/*\n * " +  "Devuelva en la variable 'a' la palabra 'Hello World', y en la variable 'b' una función que reciba como parámetro una string y la pase a minúsculas." + "\n */\n\n" + "var a;\n\nvar b = function(str){\n\n};\n",
		"score_function": ("var score = " + js_sample_multivar_score.toString()),
		"score_function_vars": ["a","b"]
	};

	/* Example 4*/
	var html_sample_score = function(document){
		try {
			var text = $(document).find("body").text().trim();
			text = text.replace(/'|"/g, ''); //ignore '' or ""
			if(text==="Hello World"){
				return 10;
			}
			if(text.toLowerCase()===("Hello World").toLowerCase()){
				return 5;
			}
		} catch (e) {}
		
		return 0;
	};

	var html_sample = {
		"type": "exercise",
		"title": "Hello World con HTML",
		"description":"Escriba una página web que ponga 'Hello World' en el body.",
		"editorMode":"HTML",
		"content": "<html>\n  <head></head>\n  <body>\n\n  </body>\n</html>",
		"score_function": ("var score = " + html_sample_score.toString())
	};

	/* Example 5*/
	var html_css_sample_score = function(document){
		var grade = {};
		grade.successes = [];
		grade.errors = [];
		grade.feedback = [];
		grade.score = 0;

		var getStyleFromCSSSelector = function(document,selectorName) {
			var classes = document.styleSheets[0].rules || document.styleSheets[0].cssRules;
			for(var x=0;x<classes.length;x++) {
				if(classes[x].selectorText===selectorName){
					if(typeof classes[x].cssText === "string"){
						return classes[x].cssText;
					} else if(typeof classes[x].style != "undefined") {
						return classes[x].style.cssText;
					} else {
						return undefined;
					}
				}
			}
		};

		var p = $(document).find("body").find("p");
		if(p.length === 0){
			grade.errors.push("No se encontró la etiqueta p.");
			grade.feedback.push("Incluya una etiqueta <p> detro de la etiqueta <body>.");
		} else {
			grade.successes.push("La etiqueta <p> fue colocada correctamente.");
			grade.score += 2;

			try {
				var textFound = false;
				var text = $(p).text().trim();
				text = text.replace(/'|"/g, ''); //ignore '' or ""

				if(text==="Hello World"){
					textFound = true;
					grade.score += 2;
				} else if(text.toLowerCase()===("Hello World").toLowerCase()){
					textFound = true;
					grade.score += 1;
					grade.feedback.push("Debes prestar más atención a las mayúsculas y minúsculas, \"" + text + "\" no es lo mismo que Hello World.");
				}

				if(textFound){
					grade.successes.push("El texto 'Hello World' fue escrito correctamente.");
				} else {
					grade.errors.push("El texto 'Hello World' no fue correctamente incluido.");
				}
			} catch(e) {}

			if($(p).hasClass("rojo")){
				grade.score += 2;
				grade.successes.push("La etiqueta <p> tiene la clase 'rojo'.");

				var pColor = $(p).css("color");
				if(pColor==="rgb(255, 0, 0)"){
					grade.successes.push("El texto es de color rojo.");
					grade.score += 4;

					//Check if the class 'rojo' has the property color: red.
					var cssTextRojo = (getStyleFromCSSSelector(document,".rojo") || getStyleFromCSSSelector(document,"p.rojo"));
					if(typeof cssTextRojo === "undefined"){
						grade.score -= 1;
						grade.feedback.push("No se encontró ningún selector para la clase rojo.\n¿Seguro que la ha definido correctamente?\nPruebe a definir el selector CSS como <b>.rojo</b> o <b>p.rojo</b>.");
					}

				} else {
					grade.errors.push("El texto no es de color rojo.");
				}

			} else {
				grade.errors.push("La etiqueta <p> no tiene la clase 'rojo'.");
			}

		}

		return grade;
	};

	var html_css_sample = {
		"type": "exercise",
		"title": "Hello World con HTML y CSS",
		"description":"Escriba una página web que ponga la palabra <b>'Hello World'</b> en el body y en color rojo. Esta palabra estará dentro de una etiqueta '<p>' que tendrá la clase 'rojo'.",
		"editorMode":"HTML",
		"content": "<html>\n  <head></head>\n  <body>\n\n  </body>\n</html>",
		"score_function": ("var score = " + html_css_sample_score.toString())
	};


	/* Test Example 1*/
	var test_sample = {
		"type": "test",
		"title": "Introducción a JavaScript",
		"exercises": JSON.stringify([ js_sample, js_sample_feedback, js_sample_multivar ])
	};


	/* MOOC 1-1*/
	var mooc11 = {
		"type": "exercise",
		"title": "Date",
		"editorMode":"HTML",
		"content": '<!DOCTYPE html><html>\n<head>\n<title>Script</title>\n<meta charset="UTF-8">\n</head>\n\n<body>\n<h3>Fecha y hora</h3>\n\n<script type="text/javascript">\ndocument.write("Fecha: " + (new Date()));\n</script>\n</body>\n</html>'
	};

	/* MOOC 1-2*/
	var mooc12 = {
		"type": "exercise",
		"title": "Date 2",
		"editorMode":"HTML",
		"content": '<!DOCTYPE html><html>\n<head>\n  <title>Ejemplo</title>\n  <meta charset="UTF-8">\n\n  <style type="text/css">     \nbody {color: blue;}   \n</style>\n</head>\n\n<body>\n  <h3>Fecha y hora</h3>\n\n  <script type="text/javascript">\n    document.write(new Date());\n  </script>\n</body>\n</html>'
	};

	/* MOOC 1-3*/
	var mooc13 = {
		"type": "exercise",
		"title": "1",
		"editorMode":"HTML",
		"content": '<!DOCTYPE html><html>\n<head>\n  <title>Ejemplo</title>\n  <meta charset="UTF-8">\n\n  <style type="text/css">     \nbody {color: blue;}   \n</style>\n</head>\n\n<body>\n  <h3>Fecha y hora</h3>\n\n  <script type="text/javascript">\n    document.write(new Date());\n  </script>\n</body>\n</html>'
	};

	/* Test Example 2*/
	var mooc_test_sample = {
		"type": "test",
		"title": "MOOC Módulo 1",
		"exercises": JSON.stringify([ mooc11, mooc12, mooc13 ])
	};


	var js_sample_without_grading = {
		"type": "exercise",
		"title": "Hello World con JavaScript sin corrección",
		"description":"Escriba 'Hello World'.",
		"editorMode":"JavaScript",
		"content": "/*\n * Escriba \"Hello World\" y ejecute el código.\n */\n "
	};

	/* Test Example 3*/
	var js_nograde = {
		"type": "test",
		"title": "JS without grading",
		"exercises": JSON.stringify([ js_sample_without_grading, js_sample_without_grading, js_sample_without_grading ])
	};

	/* Test Example 4*/
	var js_hybrid = {
		"type": "test",
		"title": "HTML and JS test",
		"exercises": JSON.stringify([ mooc11, html_css_sample, js_sample_without_grading, js_sample_multivar])
	};



	var getExample = function(exampleName){
		var example = undefined;
		try {
			eval("var example = " + exampleName);
		} catch(e) {}
		return example;
	};

	var getExamples = function(){
		var examples = [];
		examples.push(js_sample);
		examples.push(js_sample_feedback);
		examples.push(js_sample_multivar);
		examples.push(html_sample);
		examples.push(html_css_sample);
		examples.push(mooc_test_sample);
		examples.push(test_sample);
		examples.push(js_hybrid);
		return examples;
	};

	return {
		getExample  : getExample,
		getExamples : getExamples
	};

}) (CODEditor,jQuery);