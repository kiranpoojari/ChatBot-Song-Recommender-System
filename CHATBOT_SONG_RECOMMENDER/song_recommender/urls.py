from django.urls import path
from .views import chat_bot_view, index_view, process_chat, process_voice, detect_expression, process_emotion,detect_emotion

urlpatterns = [
    path('', index_view, name='index'),
    path('chatbot/', chat_bot_view, name='chatbot'),  
    path('process_voice/', process_voice, name='process_voice'),
    path('detect_expression/', detect_expression, name='detect_expression'),
    path('process_emotion/', process_emotion, name='process_emotion'),
    path('detect_emotion/',detect_emotion, name='detect_emotion'),
]
