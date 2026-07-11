import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .db import client_collection

# GET: List Clients
def get_clients(request):
    if request.method == "GET":
        try:
            clients = []
            for c in client_collection.find({}, {"_id": 0}):
                clients.append(c)
            return JsonResponse(clients, safe=False)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request method"}, status=400)

# POST: Add Client Profile
@csrf_exempt
def add_client(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            client_id = data.get("client_id")
            if not client_id:
                max_c = client_collection.find_one(sort=[("client_id", -1)])
                client_id = (max_c["client_id"] + 1) if max_c else 201
            else:
                client_id = int(client_id)

            if client_collection.find_one({"client_id": client_id}):
                return JsonResponse({"error": f"Client ID {client_id} already exists"}, status=400)

            client_doc = {
                "client_id": client_id,
                "company_name": data.get("company_name", ""),
                "contact_person": data.get("contact_person", ""),
                "email": data.get("email", ""),
                "phone": data.get("phone", ""),
                "location": data.get("location", "")
            }

            client_collection.insert_one(client_doc)
            return JsonResponse({"message": "Client profile added successfully", "client_id": client_id})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=400)

# PUT: Update Client Profile by ID
@csrf_exempt
def update_client(request, id):
    if request.method == "PUT":
        try:
            data = json.loads(request.body)
            data.pop("client_id", None)

            result = client_collection.update_one(
                {"client_id": int(id)},
                {"$set": data}
            )

            if result.modified_count > 0 or result.matched_count > 0:
                return JsonResponse({"message": "Client profile updated successfully"})
            return JsonResponse({"error": "Client profile not found or no changes made"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=400)

# DELETE: Delete Client Profile by ID
@csrf_exempt
def delete_client(request, id):
    if request.method == "DELETE":
        try:
            result = client_collection.delete_one({"client_id": int(id)})
            if result.deleted_count > 0:
                return JsonResponse({"message": "Client profile deleted successfully"})
            return JsonResponse({"error": "Client profile not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=400)
