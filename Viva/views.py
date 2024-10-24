from django.shortcuts import render

# Create your views here.
def home(request):

    return render(request, 'VivaApp/index.html')

def signup_login(request):

    return render(request, 'VivaApp/signup_login.html')


def Viva_interfcae(request):

    return render(request, 'VivaApp/Viva_interface.html')