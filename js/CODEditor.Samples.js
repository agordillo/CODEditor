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
		if(grade.score>0){
			grade.score = Math.min(10,Math.max(0,Math.pow(grade.score,2)/10) + 0.1);
		}		

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

	/* Example with 'code' in description. */
	var js_sample_code = {
		"type": "exercise",
		"title": "Ejercicio con varias variables",
		"description":"Devuelva en la variable <b>'a'</b> la palabra 'Hello World',\n<code>var a = function(){\n return a;\n}</code>\ny en la variable <b>'b'</b> una función que reciba como parámetro una string y la pase a minúsculas.",
		"editorMode":"JavaScript",
		"content": "/*\n * " +  "Devuelva en la variable 'a' la palabra 'Hello World', y en la variable 'b' una función que reciba como parámetro una string y la pase a minúsculas." + "\n */\n\n" + "var a;\n\nvar b = function(str){\n\n};\n",
		"score_function": ("var score = " + js_sample_multivar_score.toString()),
		"score_function_vars": ["a","b"]
	};


	/* Elipse */
	var js_elipse_score = function(result,variablesHash){
		var grade = {};
		grade.successes = [];
		grade.errors = [];
		grade.feedback = [];
		grade.score = 0;

		var elipse = variablesHash["elipse"];

		if(typeof elipse !== "function"){
			grade.errors.push("El valor devuelto en la variable 'elipse' no es una función.");
			return grade;
		}
		grade.score += 1;

		//Testear la función.

		var _feedbackPI = false;

		//Case: a,b numbers
		try {
			var testA = elipse(0,0);
			var testB = elipse(1,1);
			var testC = elipse(2,5);
			if((testA===0)&&(testB===Math.PI)&&(testC===10*Math.PI)){
				grade.score += 2;
				grade.successes.push("La función 'elipse' funciona correctamente cuando 'a' y 'b' son números.");
			} else {
				grade.errors.push("La función 'elipse' no calcula correctamente el valor esperado cuando 'a' y 'b' son números.");
				if(Math.abs(testB-Math.PI) < 0.1){
					grade.score += 1;
					grade.feedback.push("Algunos valores calculados se acercan bastante al esperado sin llegar a ser exactos. Recuerda que el valor de PI puede ser obtenido empleando el módulo Math de JavaScript de la siguiente forma \"Math.PI\".");
					_feedbackPI = true;
				}
			}
		} catch (e1){
			grade.errors.push("La función 'elipse' presenta errores de ejecución cuando 'a' y 'b' son números.");
		}

		if(grade.errors.length > 0){
			return grade;
		}

		//Case: a, array
		try {
			var testD = elipse([0,0]);
			var testE = elipse([1,1]);
			var testF = elipse([2,5]);
			if((testD===0)&&(testE===Math.PI)&&(testF===10*Math.PI)){
				grade.score += 2;
				grade.successes.push("La función 'elipse' funciona correctamente cuando 'a' es un array.");
			} else {
				grade.errors.push("La función 'elipse' no calcula correctamente el valor esperado cuando 'a' es un array.");
				if(Math.abs(testE-Math.PI) < 0.1){
					grade.score += 1;
					if(!_feedbackPI){
						grade.feedback.push("Algunos valores calculados se acercan bastante al esperado sin llegar a ser exactos. Recuerda que el valor de PI puede ser obtenido empleando el módulo Math de JavaScript de la siguiente forma \"Math.PI\".");
						_feedbackPI= true;
					}
				}
			}
		} catch (e2){
			grade.errors.push("La función 'elipse' presenta errores de ejecución cuando 'a' es un array.");
		}

		if(grade.errors.length > 0){
			return grade;
		}


		//Si la función recibe como parámetro un objeto que no sea un array devolverá -1.
		try {
			if((elipse({})===-1)&&(elipse(new Date())===-1)){
				grade.score += 2;
				grade.successes.push("La función 'elipse' funciona correctamente cuando 'a' es un objeto diferente de un array.");
			} else {
				grade.errors.push("La función 'elipse' no funciona correctamente cuando 'a' es un objeto diferente de un array.");
			}
		} catch (e2){
			grade.errors.push("La función 'elipse' presenta errores de ejecución cuando 'a' es un objeto diferente de un array.");
		}

		//Si la función recibe como parámetro un array que no contenga los valores adecuados devolverá -2.
		try {
			if((elipse([])===-2)&&(elipse([5,"test"])===-2)&&(elipse([undefined,5])===-2)){
				grade.score += 1;
				grade.successes.push("La función 'elipse' funciona correctamente cuando 'a' es un array inválido.");
			} else {
				grade.errors.push("La función 'elipse' no funciona correctamente cuando 'a' es un array inválido.");
			}

			if(elipse([-1,-1])===-2){
				grade.score += 1;
			} else {
				grade.feedback.push("Un array que contenga números negativos también se considera un array inválido.");
			}

		} catch (e2){
			grade.errors.push("La función 'elipse' presenta errores de ejecución cuando 'a' es un array inválido.");
		}

		// En cualquier otro caso en que la función reciba parámetros erroneos deberá devolver el valor -3.
		try {
			if((elipse()===-3)&&(elipse(5)===-3)&&(elipse(5,null)===-3)&&(elipse(undefined,5)===-3)&&(elipse("perro",10)===-3)){
				grade.score += 1;
				grade.successes.push("La función 'elipse' funciona correctamente cuando recibe parámetros inválidos.");
			} else {
				grade.errors.push("La función 'elipse' no funciona correctamente cuando recibe parámetros inválidos.");
			}

			if(elipse(-1,-1)===-3){
				grade.score += 1;
			} else {
				grade.feedback.push("Los valores a y b deberían ser siempre positivos. De lo contrario se deberían considerarse parámetros inválidos.");
			}

		} catch (e2){
			grade.errors.push("La función 'elipse' presenta errores de ejecución cuando recibe parámetros inválidos.");
		}

		//Scale grade
		grade.score = Math.min(10,Math.max(0,grade.score));

		//Passed threshold: 8
		if(grade.score < 8){
			grade.score = 4;
		}

		if(grade.score===10){
			grade.feedback.push("¡Enhorabuena, tu solución es perfecta!");
		}

		return grade;
	};

	var js_elipse_description = "Devuelva en la variable <b>'elipse'</b> una función que calcule el área de una elipse de acuerdo a la fórmula <code>Área = &#928;·a·b</code>, siendo a y b el radio de los semiejes de la elipse. "
	js_elipse_description += "La función podrá ser invocada de dos formas diferentes:\n  a) mediante dos parámetros numéricos '<b>a</b>' y '<b>b</b>'.\n  b) mediante un solo parámetro de tipo array que contenga los valores de a y b.\n";
	js_elipse_description += "-> Si la función recibe como parámetro un objeto que no sea un array devolverá <b>-1</b>.\n";
	js_elipse_description += "-> Si la función recibe como parámetro un array que no contenga los valores adecuados devolverá <b>-2</b>.\n";
	js_elipse_description += "-> En cualquier otro caso en que la función reciba parámetros erroneos deberá devolver el valor <b>-3</b>.\n";
	js_elipse_description += "-> Si los parámetros son correctos, la función devolverá el valor del área de la elipse.\n";

	var js_elipse = {
		"type": "exercise",
		"title": "Área de una elipse",
		"description":js_elipse_description,
		"editorMode":"JavaScript",
		"content": "/*\n * " +  "Devuelva en la variable 'elipse' una función que calcule el área de una elipse de acuerdo a la fórmula 'Área = Π·a·b'" + "\n */\n\n" + "var elipse = function(a,b){\n\n};\n",
		"score_function": ("var score = " + js_elipse_score.toString()),
		"score_function_vars": ["elipse"]
	};


	/* Reloj */
	var js_dom_reloj_content = '<!DOCTYPE html>\n<html>\n<head>\n    <title>Reloj</title>\n    <meta charset="UTF-8">\n    <script type="text/javascript">\n        function mostrar_fecha(){\n            var cl = document.getElementById("fecha");\n            cl.innerHTML = new Date();\n        }\n    </script>\n</head>\n<body>\n    <h2>Reloj</h2>\n    <div id="fecha"></div>\n    <script type="text/javascript">\n        mostrar_fecha(); //muestra fecha al cargar\n                         // actualiza cada segundo\n        setInterval(mostrar_fecha, 1000);\n    </script>\n</body>\n</html>';
	var js_dom_reloj = {
		"type": "exercise",
		"title": "Reloj",
		"description": "Ejemplo de Reloj con JavaScript\nTrate de conseguir el mismo resultado empleando JQuery.\nPuede importar la librería de un CDN mediante la siguiente etiqueta: <code><script src=\"http://code.jquery.com/jquery-1.11.2.min.js\"></script></code>.",
		"editorMode":"HTML",
		"content": js_dom_reloj_content
	};

	/* JQuery Intro */
	var jquery_intro_score = function(document){
		var grade = {};
		grade.successes = [];
		grade.errors = [];
		grade.feedback = [];
		grade.score = 0;

		// Añada el título "JQuery" a la página web.
		var title = $(document).find("head").find("title").html();
		if((typeof title === "string")&&(title.trim().toLowerCase()==="jquery")){
			grade.successes.push("Cambiaste el título de la página web correctamente.");
			grade.score += 2;
		} else {
			grade.errors.push("No cambiaste correctamente el título de la página web.");
		}

		if(grade.errors.length > 0){
			return grade;
		}

		//Centre la cabecera <header>.
		var header = $(document).find("header");
		if($(header).css("text-align")==="center"){
			grade.successes.push("Centraste el <header> correctamente.");
			grade.score += 1;
		} else {
			grade.errors.push("El <header> no está centrado.");
		}

		if(grade.errors.length > 0){
			return grade;
		}

		//Cambie a 20px el tamaño de fuente de los <p> con clase "title".
		var ps = $(document).find("p.title");
		if($(ps).css("font-size")==="20px"){
			grade.successes.push("Cambiaste el tamaño de los <p> con clase title correctamente.");
			grade.score += 1;
		} else {
			grade.errors.push("Los elementos p con clase title no tienen el tamaño de fuente correcto.");
		}

		if(grade.errors.length > 0){
			return grade;
		}


		//Ponga fondo negro y letra blanca a los <div> que estén dentro del elemento con id "news".
		var divs = $(document).find("#news div");
		var _background = false;
		var _color = false;

		if($(divs).css("background-color")==="rgb(0, 0, 0)"){
			_background = true;
		} else {
			_background = false;
		}

		if($(divs).css("color")==="rgb(255, 255, 255)"){
			_color = true;
		} else {
			_color = false;
		}

		if(_background&&_color){
			grade.successes.push("Los <div> dentro del elemento con id news tienen el estilo adecuado.");
			grade.score += 2;
		} else {
			if(!_background){
				grade.errors.push("Los <div> dentro del elemento con id news no tienen el fondo adecuado.");
			}
			if(!_color){
				grade.errors.push("Los <div> dentro del elemento con id news no tienen el color adecuado.");
			}
		}

		if(grade.errors.length > 0){
			return grade;
		}

		// Incluya un manejador de eventos a todos los <li> cuyo atributo "alert" sea igual a "yes", de modo que si se pulsa sobre alguno de ellos su contenido se escriba en el <footer> de la página.
		var triggerElement = $(document).find("[alert='yes']")[0];
		if(typeof triggerElement == "undefined"){
			grade.errors.push("No se encontró ningún elemento escuchando al evento.");
			return grade;
		}

		var footer = $(document).find("footer");
		var oldFooterVal = $(footer).html();
		var triggerElementVal = $(triggerElement).html();

		$(footer).html("");
		$(triggerElement).trigger("click");
		if($(footer).html()===triggerElementVal){
			//Success
			grade.score += 4;
			grade.successes.push("El manejador de eventos funciona acorde a lo esperado.");
		} else {
			//Fail
			grade.errors.push("El manejador de eventos no funciona acorde a lo esperado.");
		}

		$(footer).html(oldFooterVal);

		//Passed threshold: 8
		if(grade.score < 8){
			grade.score = 4;
		}

		if(grade.score===10){
			grade.feedback.push("¡Enhorabuena, tu solución es perfecta!");
		}

		return grade;
	};

	var js_jquery_intro_description = "Empleando JQuery realice los siguiente cambios en la página web:\n"
	js_jquery_intro_description += "-> Añada el título \"JQuery\" a la página web.\n";
	js_jquery_intro_description += "-> Centre la cabecera <code><header></code>.\n";
	js_jquery_intro_description += "-> Cambie a 20px el tamaño de fuente de los <code><p></code> con clase \"title\".\n";
	js_jquery_intro_description += "-> Ponga fondo negro y letra blanca a los <code><div></code> que estén dentro del elemento con id \"news\".\n";
	js_jquery_intro_description += "-> Incluya un manejador de eventos a todos los <code><li></code> cuyo atributo \"alert\" sea igual a \"yes\", de modo que si se pulsa sobre alguno de ellos su contenido se escriba en el <code><footer></code> de la página.\n";
	
	var jquery_intro_content = '<!DOCTYPE html>\n<html>\n  <head>\n        <meta charset="UTF-8">\n        <script src=\"http://code.jquery.com/jquery-1.11.2.min.js\"></script>\n        <script type="text/javascript">\n            $(document).ready(function(){\n                //Escribe tu solución aquí\n                \n            });\n      </script>\n  </head>\n  <body>\n    <header>Aprendiendo a utilizar los selectores de JQuery</header>\n    <article>\n        <div>\n            <p class="title">Características de JQuery</p>\n            <ul>\n                <li>Rápido</li>\n                <li alert="yes">Ligero</li>\n                <li>Multi-navegador</li>\n            </ul>\n        </div>\n    </article>\n    <article id="news">\n        <div class="title">\n            <a target="_blank" href="http://jquery.com/">JQuery website</a>\n        </div>\n    </article>\n    <footer></footer>\n  </body>\n</html>';
	var jquery_intro = {
		"type": "exercise",
		"title": "JQuery Intro",
		"description": js_jquery_intro_description,
		"editorMode":"HTML",
		"content": jquery_intro_content,
		"score_function": ("var score = " + jquery_intro_score.toString())
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
		examples.push(js_elipse);
		examples.push(html_sample);
		examples.push(html_css_sample);
		examples.push(js_dom_reloj);
		examples.push(jquery_intro);
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