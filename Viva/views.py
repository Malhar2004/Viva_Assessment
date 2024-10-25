from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib.auth import login, authenticate
import secrets
from django.http import JsonResponse
import shutil  # Import shutil to delete directories
from django.core.files.storage import default_storage  # Import storage to handle file saving

from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib import messages
import os
import json
from django.conf import settings  # To access BASE_DIR
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from langchain_community.document_loaders import UnstructuredPDFLoader, DirectoryLoader
from langchain_text_splitters import CharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_groq import ChatGroq
from langchain.chains import RetrievalQA


from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
qa_pairs = []  # To store QA pairs globally

model = SentenceTransformer("all-MiniLM-L6-v2")

# View for Processing QA after File Detection
def process_qa(request):
    GROQ_API_KEY = "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"

    data_folder = os.path.join(settings.BASE_DIR, 'data/')
    # doc_db_path = os.path.join(settings.BASE_DIR, 'doc_db')  # Path to the doc_db directory

    # Check if the doc_db directory exists and delete it if it does
    # if os.path.exists(doc_db_path):
        # shutil.rmtree(doc_db_path)  # Delete the existing doc_db directory

    # Check if data_folder exists and contains files
    if os.path.exists(data_folder) and os.listdir(data_folder):
        # Load and prepare the QA chain only if files are found in the 'data' folder
        loader = DirectoryLoader(data_folder, glob="./*.pdf", loader_cls=UnstructuredPDFLoader)
        documents = loader.load()

        text_splitter = CharacterTextSplitter(
            chunk_size=2000,
            chunk_overlap=500
        )
        text_chunks = text_splitter.split_documents(documents)

        # Create a new doc_db directory
        # os.makedirs(doc_db_path)  # Create the new doc_db directory

        persist_directory = "doc_db"
        embedding = HuggingFaceEmbeddings()

        vectorstore = Chroma.from_documents(
            documents=text_chunks,
            embedding=embedding,
            persist_directory=persist_directory  # Use the new path for doc_db
        )

        retriever = vectorstore.as_retriever()

        llm = ChatGroq(
            api_key=GROQ_API_KEY,
            model="mixtral-8x7b-32768",
            temperature=0
        )

        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=retriever,
            return_source_documents=True
        )

        query = "Generate only 10 short questions with their short answers from the overall text"
        response = qa_chain.invoke({"query": query})
        print(response)

        qa_text = response.get("result", "")
        print("Raw Response from QA Chain:\n", qa_text)  # Debugging step

        qa_pairs.clear()  # Clear any existing QA pairs before appending new ones

        # Process the text to split into individual questions and answers
        for entry in qa_text.split("\n\n"):
            if entry.strip():
                parts = entry.split("Answer:", 1)
                print("Processing Entry:\n", entry)

                if len(parts) == 2:
                    question = parts[0].strip().lstrip("0123456789. ").strip()
                    answer = parts[1].strip()
                    qa_pairs.append({"Question": question, "Answer": answer})

        print("Done")
        if qa_pairs:
            print(f"QA Pairs generated: {qa_pairs}")
        else:
            print("No QA pairs generated.")

        return JsonResponse({"success": True, "message": "QA generation complete", "qa_pairs": qa_pairs})
    else:
        return JsonResponse({"success": False, "message": "No files found in the data folder."})


# View to handle the question generation in the front-end chatbot
def rag(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        current_index = data.get('current_index', 0)

        if current_index < len(qa_pairs):
            # Return the current question
            question = qa_pairs[current_index]['Question']
            return JsonResponse({"success": True, "question": question})
        else:
            return JsonResponse({"success": False, "message": "No more questions available."})

    return JsonResponse({"success": False, "message": "Invalid request method"})





# View to handle the response comparison
def rag_compare(request):
    # View to handle the response comparison and scoring
        if request.method == 'POST':
            data = json.loads(request.body)
            user_response = data.get('user_response', '').strip()
            question_index = data.get('question_index')

            if question_index < len(qa_pairs):
                expected_answer = qa_pairs[question_index]['Answer'].strip()

                # Use SentenceTransformer for semantic similarity comparison
                user_embedding = model.encode(user_response)
                expected_embedding = model.encode(expected_answer)

                # Calculate cosine similarity
                similarity = cosine_similarity(
                    user_embedding.reshape(1, -1),
                    expected_embedding.reshape(1, -1)
                )[0][0]

                # Convert similarity score to Python float
                similarity = float(similarity)

                # Define thresholds for similarity
                full_credit_threshold = 0.65
                partial_credit_threshold = 0.5

                # Initialize the score
                score = 0.0

                # Calculate the score based on similarity
                if similarity >= full_credit_threshold:
                    score = 1.0  # Full credit
                elif partial_credit_threshold <= similarity < full_credit_threshold:
                    score = 0.5  # Partial credit

                # Log the score and similarity for debugging
                print(f"Similarity: {similarity}, Score: {score}")

                if score > 0:
                    return JsonResponse({
                        "success": True,
                        "similarity": similarity,
                        "score": score
                    })
                else:
                    return JsonResponse({
                        "success": False,
                        "message": "Incorrect answer",
                        "similarity": similarity,
                        "score": score
                    })
            else:
                return JsonResponse({"success": False, "message": "Question index out of range."})

        return JsonResponse({"success": False, "message": "Invalid request method"})


# Create your views here.
def home(request):
    return render(request, 'VivaApp/index.html')


def signup_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')

        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already exists.")
            return redirect('sign_log')  # Adjust the URL name as needed

        # Create a new user
        user = User.objects.create_user(username=username, email=email, password=password)
        user.save()
        messages.success(request, "Account created successfully. You can now log in.")
        return redirect('sign_log')  # Redirect to the login page

    return render(request, 'VivaApp/signup_login.html')

def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        # print(username,password)
        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            return redirect('Viva_inter')  # Adjust the URL name as needed
        else:
            messages.error(request, "Invalid username or password.")
            return redirect('sign_log')  # Redirect back to the login page

    return render(request, 'VivaApp/signup_login.html')

def logout_view(request):
    logout(request)
    messages.success(request, "You have been logged out.")
    return redirect('home')  # Redirect to the login page


def signup_login(request):
    return render(request, 'VivaApp/signup_login.html')

def Viva_interface(request):
    return render(request, 'VivaApp/Viva_interface.html')


@csrf_exempt  # Temporarily exempt from CSRF for testing (better to use tokens in production)
def upload_file(request):
    if request.method == 'POST' and request.FILES['file']:
        # Get the uploaded file
        uploaded_file = request.FILES['file']

        # Define the path to save the file in the 'data' folder
        data_folder = os.path.join(settings.BASE_DIR, 'data/')
        if not os.path.exists(data_folder):
            os.makedirs(data_folder)  # Create 'data' folder if it doesn't exist

        # Remove any existing files in the 'data' folder
        for filename in os.listdir(data_folder):
            file_path = os.path.join(data_folder, filename)
            if os.path.isfile(file_path):
                os.remove(file_path)

        # Save the new file
        file_path = os.path.join(data_folder, uploaded_file.name)
        with open(file_path, 'wb+') as destination:
            for chunk in uploaded_file.chunks():
                destination.write(chunk)

        return redirect('process_qa')

    return JsonResponse({'success': False, 'message': 'File upload failed'})

