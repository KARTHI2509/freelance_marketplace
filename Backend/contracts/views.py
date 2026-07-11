import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .db import contract_collection

# GET: List Contracts (supports freelancer/client filter)
def get_contracts(request):
    if request.method == "GET":
        try:
            freelancer_name = request.GET.get("freelancer")
            client_name = request.GET.get("client")
            
            query = {}
            if freelancer_name:
                query["freelancer_name"] = freelancer_name
            if client_name:
                query["client_name"] = client_name

            contracts = []
            for c in contract_collection.find(query, {"_id": 0}):
                contracts.append(c)
            return JsonResponse(contracts, safe=False)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request method"}, status=400)

# POST: Create Contract manually (e.g. standard admin overrides)
@csrf_exempt
def add_contract(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            contract_id = data.get("contract_id")
            if not contract_id:
                max_c = contract_collection.find_one(sort=[("contract_id", -1)])
                contract_id = (max_c["contract_id"] + 1) if max_c else 501
            else:
                contract_id = int(contract_id)

            if contract_collection.find_one({"contract_id": contract_id}):
                return JsonResponse({"error": f"Contract ID {contract_id} already exists"}, status=400)

            contract_doc = {
                "contract_id": contract_id,
                "project_title": data.get("project_title", ""),
                "freelancer_name": data.get("freelancer_name", ""),
                "client_name": data.get("client_name", ""),
                "agreed_budget": float(data.get("agreed_budget", 0.0)),
                "start_date": data.get("start_date", ""),
                "end_date": data.get("end_date", ""),
                "contract_status": data.get("contract_status", "Active")
            }

            contract_collection.insert_one(contract_doc)
            return JsonResponse({"message": "Contract created successfully", "contract_id": contract_id})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=400)

# PUT: Update Contract details (e.g. Mark Completed, Cancel, or change budget)
@csrf_exempt
def update_contract(request, id):
    if request.method == "PUT":
        try:
            data = json.loads(request.body)
            data.pop("contract_id", None)

            if "agreed_budget" in data:
                data["agreed_budget"] = float(data["agreed_budget"])

            result = contract_collection.update_one(
                {"contract_id": int(id)},
                {"$set": data}
            )

            if result.modified_count > 0 or result.matched_count > 0:
                return JsonResponse({"message": "Contract updated successfully"})
            return JsonResponse({"error": "Contract not found or no changes made"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=400)

# DELETE: Cancel/Delete Contract
@csrf_exempt
def delete_contract(request, id):
    if request.method == "DELETE":
        try:
            # Instead of deleting, we change status to Cancelled
            result = contract_collection.update_one(
                {"contract_id": int(id)},
                {"$set": {"contract_status": "Cancelled"}}
            )
            if result.modified_count > 0 or result.matched_count > 0:
                return JsonResponse({"message": "Contract cancelled successfully"})
            return JsonResponse({"error": "Contract not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=400)
