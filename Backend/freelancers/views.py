import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .db import freelancer_collection

# GET: List Freelancers
def get_freelancers(request):
    if request.method == "GET":
        try:
            freelancers = []
            for f in freelancer_collection.find({}, {"_id": 0}):
                freelancers.append(f)
            return JsonResponse(freelancers, safe=False)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request method"}, status=400)

# POST: Add Freelancer Profile
@csrf_exempt
def add_freelancer(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            freelancer_id = data.get("freelancer_id")
            if not freelancer_id:
                max_f = freelancer_collection.find_one(sort=[("freelancer_id", -1)])
                freelancer_id = (max_f["freelancer_id"] + 1) if max_f else 101
            else:
                freelancer_id = int(freelancer_id)

            if freelancer_collection.find_one({"freelancer_id": freelancer_id}):
                return JsonResponse({"error": f"Freelancer ID {freelancer_id} already exists"}, status=400)

            freelancer_doc = {
                "freelancer_id": freelancer_id,
                "full_name": data.get("full_name", ""),
                "email": data.get("email", ""),
                "phone": data.get("phone", ""),
                "skills": data.get("skills", ""),
                "experience": int(data.get("experience", 0)),
                "hourly_rate": float(data.get("hourly_rate", 0.0))
            }

            freelancer_collection.insert_one(freelancer_doc)
            return JsonResponse({"message": "Freelancer profile added successfully", "freelancer_id": freelancer_id})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=400)

# PUT: Update Freelancer Profile by ID
@csrf_exempt
def update_freelancer(request, id):
    if request.method == "PUT":
        try:
            data = json.loads(request.body)
            data.pop("freelancer_id", None)

            if "experience" in data:
                data["experience"] = int(data["experience"])
            if "hourly_rate" in data:
                data["hourly_rate"] = float(data["hourly_rate"])

            result = freelancer_collection.update_one(
                {"freelancer_id": int(id)},
                {"$set": data}
            )

            if result.modified_count > 0 or result.matched_count > 0:
                return JsonResponse({"message": "Freelancer profile updated successfully"})
            return JsonResponse({"error": "Freelancer profile not found or no changes made"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=400)

# DELETE: Delete Freelancer Profile by ID
@csrf_exempt
def delete_freelancer(request, id):
    if request.method == "DELETE":
        try:
            result = freelancer_collection.delete_one({"freelancer_id": int(id)})
            if result.deleted_count > 0:
                return JsonResponse({"message": "Freelancer profile deleted successfully"})
            return JsonResponse({"error": "Freelancer profile not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=400)
