import speech_recognition as sr
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt 
def process_voice(request):
    if request.method == 'POST':
        recognizer = sr.Recognizer()
        audio_file = request.FILES.get('audio')

        
        if not audio_file:
            return JsonResponse({'error': 'No audio file provided'}, status=400)

        try:
            with sr.AudioFile(audio_file) as source:
                audio = recognizer.record(source)
                text = recognizer.recognize_google(audio)
                return JsonResponse({'text': text})
        except sr.UnknownValueError:
            return JsonResponse({'error': 'Could not understand the audio'}, status=400)
        except sr.RequestError:
            return JsonResponse({'error': 'Could not request results from Google API'}, status=500)
    return JsonResponse({'error': 'Invalid request method'}, status=400)
