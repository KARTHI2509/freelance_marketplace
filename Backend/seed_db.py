import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load env variables
load_dotenv()

def seed_database():
    mongo_uri = os.getenv("MONGO_URI")
    db_name = os.getenv("DATABASE_NAME", "freelance_db")
    
    print(f"Connecting to MongoDB database '{db_name}'...")
    client = MongoClient(mongo_uri)
    db = client[db_name]

    # Clean existing data
    print("Clearing collections...")
    db["freelancers"].delete_many({})
    db["clients"].delete_many({})
    db["projects"].delete_many({})
    db["bids"].delete_many({})
    db["contracts"].delete_many({})

    # Seed Freelancers
    print("Seeding Freelancers...")
    freelancers = [
        {
            "freelancer_id": 101,
            "full_name": "Rahul Sharma",
            "email": "rahul@gmail.com",
            "phone": "9876543210",
            "skills": "MERN Stack, Django",
            "experience": 3,
            "hourly_rate": 20.0
        },
        {
            "freelancer_id": 102,
            "full_name": "Sarah Connor",
            "email": "sarah@gmail.com",
            "phone": "9876543212",
            "skills": "Graphic Design, Illustrator",
            "experience": 5,
            "hourly_rate": 25.0
        },
        {
            "freelancer_id": 103,
            "full_name": "Vikram Adithya",
            "email": "vikram@gmail.com",
            "phone": "9876543215",
            "skills": "Content Writing, SEO Strategy",
            "experience": 2,
            "hourly_rate": 15.0
        }
    ]
    db["freelancers"].insert_many(freelancers)

    # Seed Clients
    print("Seeding Clients...")
    clients = [
        {
            "client_id": 201,
            "company_name": "Tech Solutions Pvt Ltd",
            "contact_person": "Anjali Verma",
            "email": "client@techsolutions.com",
            "phone": "9988776655",
            "location": "Bangalore"
        },
        {
            "client_id": 202,
            "company_name": "Creative Agency Inc",
            "contact_person": "Arthur Dent",
            "email": "arthur@creative.com",
            "phone": "9988776656",
            "location": "Mumbai"
        }
    ]
    db["clients"].insert_many(clients)

    # Seed Projects
    print("Seeding Projects...")
    projects = [
        {
            "project_id": 301,
            "project_title": "E-Commerce Website",
            "description": "Develop a responsive e-commerce platform.",
            "category": "Web Development",
            "budget": 50000.0,
            "deadline": "2026-08-30",
            "client_name": "Tech Solutions Pvt Ltd"
        },
        {
            "project_id": 302,
            "project_title": "Company Brand Logo",
            "description": "Design a modern minimalist brand logo.",
            "category": "Graphic Design",
            "budget": 5000.0,
            "deadline": "2026-08-15",
            "client_name": "Creative Agency Inc"
        }
    ]
    db["projects"].insert_many(projects)

    # Seed Bids
    print("Seeding Bids...")
    bids = [
        {
            "bid_id": 401,
            "project_title": "E-Commerce Website",
            "freelancer_name": "Rahul Sharma",
            "bid_amount": 45000.0,
            "proposal": "I can complete the project in 25 days.",
            "status": "Pending"
        },
        {
            "bid_id": 402,
            "project_title": "Company Brand Logo",
            "freelancer_name": "Sarah Connor",
            "bid_amount": 4000.0,
            "proposal": "I will deliver 3 design options in 5 days.",
            "status": "Pending"
        }
    ]
    db["bids"].insert_many(bids)

    # Seed Contracts
    print("Seeding Contracts...")
    contracts = [
        {
            "contract_id": 501,
            "project_title": "E-Commerce Website",
            "freelancer_name": "Rahul Sharma",
            "client_name": "Tech Solutions Pvt Ltd",
            "agreed_budget": 45000.0,
            "start_date": "2026-08-05",
            "end_date": "2026-08-30",
            "contract_status": "Active"
        }
    ]
    db["contracts"].insert_many(contracts)

    print("Database seeding completed successfully for Freelance Marketplace!")

if __name__ == "__main__":
    seed_database()
