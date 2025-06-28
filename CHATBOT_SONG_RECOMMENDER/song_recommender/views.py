import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from django.shortcuts import render
from fer import FER

sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(
    client_id='7c6fd0ea60de40b094e5b90a77112a7f',
    client_secret='0c2cb1ad1a55489c84af56b03531f4f8'
))

def chat_bot_view(request):
    return render(request, 'chat_bot.html')

def index_view(request):
    return render(request, 'index.html')

def get_song_recommendations(query):
    try:
        results = sp.search(q=query, type='track', limit=8)
        songs = []

        for track in results['tracks']['items']:
            song_info = {
                'name': track['name'],
                'artist': ', '.join(artist['name'] for artist in track['artists']),
                'url': track['external_urls']['spotify'],
                'preview_url': track['preview_url'],
                'album_art': track['album']['images'][0]['url']
            }
            songs.append(song_info)

        return songs
    except Exception as e:
        print(f"Error getting song recommendations: {e}")
        return []

@csrf_exempt
def process_chat(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            chat_input = data.get('chat_input', '')
            recommendations = get_song_recommendations(chat_input)
            return JsonResponse({'songs': recommendations})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request method.'}, status=405)

@csrf_exempt
def process_voice(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            voice_input = data.get('voice_input', '')
            recommendations = get_song_recommendations(voice_input)
            return JsonResponse({'songs': recommendations})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request method.'}, status=405)
