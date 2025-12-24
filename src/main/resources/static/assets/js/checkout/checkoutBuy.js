








//UI functionalities

//Addres type selection
const homeRadio = document.getElementById('homeAddress');
const workRadio = document.getElementById('workAddress');

homeRadio.addEventListener('change', function(){
    if(this.checked){
        workRadio.checked = false;
    }
});
workRadio.addEventListener('change', function(){
    if(this.checked){
        homeRadio.checked = false;
    }
});

//payment method selection
const esewaRadio = document.getElementById('esewaPayment');
const khaltiRadio = doument.getElementById('khaltiPayment');

esewaRadio.addEventListener('change', function(){
    if(this.checked){
        khaltiRadio.checked = false;
    }
});
workRadio.addEventListener('change', function(){
    if(this.checked){
        esewaRadio.checked = false;
    }
});