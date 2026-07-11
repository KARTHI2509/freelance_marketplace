import json
import datetime
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .db import bid_collection
from pymongo import MongoClient
import os

client = MongoClient(os.getenv("MONGO_URI"))
db = client[os.getenv("DATABASE_NAME")]

# GET: List Bids
def get_bids(request):
    if request.method == "GET":
        try:
            freelancer_name = request.GET.get("freelancer")
            project_title = request.GET.get("project")
            query = {}
            if freelancer_name:
                query["freelancer_name"] = freelancer_name
            if project_title:
                query["project_title"] = project_title

            bids = []
            for b in bid_collection.find(query, {"_id": 0}):
                bids.append(b)
            return JsonResponse(bids, safe=False)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request method"}, status=400)

# POST: Submit Bid
@csrf_exempt
def add_bid(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            bid_id = data.get("bid_id")
            if not bid_id:
                max_b = bid_collection.find_one(sort=[("bid_id", -1)])
                bid_id = (max_b["bid_id"] + 1) if max_b else 401
            else:
                bid_id = int(bid_id)

            if bid_collection.find_one({"bid_id": bid_id}):
                return JsonResponse({"error": f"Bid ID {bid_id} already exists"}, status=400)

            # Check if this freelancer already bid on this project
            project_title = data.get("project_title", "")
            freelancer_name = data.get("freelancer_name", "")
            if bid_collection.find_one({"project_title": project_title, "freelancer_name": freelancer_name}):
                return JsonResponse({"error": "You have already submitted a bid for this project"}, status=400)

            bid_doc = {
                "bid_id": bid_id,
                "project_title": project_title,
                "freelancer_name": freelancer_name,
                "bid_amount": float(data.get("bid_amount", 0)),
                "proposal": data.get("proposal", ""),
                "status": data.get("status", "Pending")
            }

            bid_collection.insert_one(bid_doc)
            return JsonResponse({"message": "Bid submitted successfully", "bid_id": bid_id})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=400)

# PUT: Accept / Reject Bid
@csrf_exempt
def update_bid(request, id):
    if request.method == "PUT":
        try:
            data = json.loads(request.body)
            data.pop("bid_id", None)

            if "bid_amount" in data:
                data["bid_amount"] = float(data["bid_amount"])

            status_val = data.get("status")

            # Update the specific bid
            result = bid_collection.update_one(
                {"bid_id": int(id)},
                {"$set": data}
            )

            if result.matched_count == 0:
                return JsonResponse({"error": "Bid not found"}, status=404)

            # Accept Bid logic: reject other bids for this project & generate Contract
            if status_val == "Accepted":
                current_bid = bid_collection.find_one({"bid_id": int(id)})
                project_title = current_bid["project_title"]
                freelancer_name = current_bid["freelancer_name"]

                # 1. Reject other bids
                bid_collection.update_many(
                    {"project_title": project_title, "bid_id": {"$ne": int(id)}},
                    {"$set": {"status": "Rejected"}}
                )

                # 2. Get project details for client name and deadline
                proj = db["projects"].find_one({"project_title": project_title})
                client_name = proj["client_name"] if proj else "Tech Solutions Pvt Ltd"
                deadline = proj["deadline"] if proj else "2026-08-30"

                # 3. Create Contract automatically
                max_contract = db["contracts"].find_one(sort=[("contract_id", -1)])
                new_contract_id = (max_contract["contract_id"] + 1) if max_contract else 501

                contract_doc = {
                    "contract_id": new_contract_id,
                    "project_title": project_title,
                    "freelancer_name": freelancer_name,
                    "client_name": client_name,
                    "agreed_budget": current_bid["bid_amount"],
                    "start_date": datetime.date.today().strftime("%Y-%m-%d"),
                    "end_date": deadline,
                    "contract_status": "Active"
                }

                db["contracts"].insert_one(contract_doc)
                return JsonResponse({"message": "Bid accepted and contract created successfully", "contract_id": new_contract_id})

            return JsonResponse({"message": "Bid updated successfully"})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=400)

# DELETE: Delete Bid
@csrf_exempt
def delete_bid(request, id):
    if request.method == "DELETE":
        try:
            result = bid_collection.delete_one({"bid_id": int(id)})
            if result.deleted_count > 0:
                return JsonResponse({"message": "Bid deleted successfully"})
            return JsonResponse({"error": "Bid not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Invalid request method"}, status=400)
