/*
 * Devuelva en la variable 'elipse' una función que calcule el área de una elipse de acuerdo a la fórmula 'Área = Π·a·b'
 */

var elipse = function(a,b){
    if(typeof a == "object"){
        if(a instanceof Array){
            if((typeof a[0] == "number")||(typeof a[1] == "number")){
                if((a[0]>=0)&&(a[1]>=0)){
                    return a[0]*a[1]*Math.PI;
                }
            }
            return -2;
        } else {
            return -1;
        }
    } else {
        if((typeof a == "number")&&(typeof b == "number")){
            if((a>=0)&&(b>=0)){
                return a*b*Math.PI;
            }
        }
        return -3;
    }
};