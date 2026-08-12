from django.shortcuts import render

def home(request):

    context = {
        "title": "آموزشگاه موسیقی طریقت",
        "welcome": "به آموزشگاه موسیقی طریقت خوش آمدید 🎵",
        "teacher": "استاد میلاد طریقت",
    }

    return render(request, 'core/index.html', context)