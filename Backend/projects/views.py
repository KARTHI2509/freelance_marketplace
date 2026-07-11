import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .db import project_collection

# GET: List Projects (supports client filter)
def get_projects(request):
    if request.method == "GET":
        try:
            client_name = request.GET.get("client")
            query = {}
            if client_name:
                query["client_name"] = client_name

            projects = []
            for p in project_collection.find(query, {"_id": 0}):
                projects.append(p)
            return JsonResponse(projects, safe=False)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request method"}, status=400)

# POST: Post Project
@csrf_exempt
def add_project(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            project_id = data.get("project_id")
            if not project_id:
                max_p = project_collection.find_one(sort=[("project_id", -1)])
                project_id = (max_p["project_id"] + 1) if max_p else 301
            else:
                project_id = int(project_id)

            if project_collection.find_one({"project_id": project_id}):
                return JsonResponse({"error": f"Project ID {project_id} already exists"}, status=400)

            project_doc = {
                "project_id": project_id,
                "project_title": data.get("project_title", ""),
                "description": data.get("description", ""),
                "category": data.get("category", ""),
                "budget": float(data.get("budget", 0)),
                "deadline": data.get("deadline", ""),
                "client_name": data.get("client_name", "")
            }

            project_collection.insert_one(project_doc)
            return JsonResponse({"message": "Project posted successfully", "project_id": project_id})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=400)

# PUT: Update Project Details
@csrf_exempt
def update_project(request, id):
    if request.method == "PUT":
        try:
            data = json.loads(request.body)
            data.pop("project_id", None)

            if "budget" in data:
                data["budget"] = float(data["budget"])

            result = project_collection.update_one(
                {"project_id": int(id)},
                {"$set": data}
            )

            if result.modified_count > 0 or result.matched_count > 0:
                return JsonResponse({"message": "Project updated successfully"})
            return JsonResponse({"error": "Project not found or no changes made"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=400)

# DELETE: Delete Project
@csrf_exempt
def delete_project(request, id):
    if request.method == "DELETE":
        try:
            result = project_collection.delete_one({"project_id": int(id)})
            if result.deleted_count > 0:
                return JsonResponse({"message": "Project deleted successfully"})
            return JsonResponse({"error": "Project not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=400)
