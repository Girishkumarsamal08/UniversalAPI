import requests

class HubspotProvider:

    def __init__(self, token):
        self.token = token

    def get_contacts(self):
        # Initial dummy check
        if self.token == "demo_token_123":
            return {
                "meta": {"mode": "dummy_data", "source": "HubSpot (Mocked)"},
                "results": self.normalize({"results": [
                    {"properties": {"firstname": "Sample", "lastname": "User", "email": "sample@example.com"}}
                ]})
            }

        headers = {
            "Authorization": f"Bearer {self.token}"
        }

        url = "https://api.hubapi.com/crm/v3/objects/contacts"

        try:
            response = requests.get(url, headers=headers)
            if response.status_code != 200:
                print(f"Error fetching contacts: {response.text}")
                return {"meta": {"mode": "error", "error": response.text}, "results": []}
            
            data = response.json()
            return {
                "meta": {"mode": "real_data", "source": "HubSpot API"},
                "results": self.normalize(data)
            }
        except Exception as e:
            print(f"HubSpot connection error: {e}")
            return {"meta": {"mode": "exception", "error": str(e)}, "results": []}

    def normalize(self, data):
        results = []

        for item in data.get("results", []):
            results.append({
                "first_name": item["properties"].get("firstname"),
                "last_name": item["properties"].get("lastname"),
                "email": item["properties"].get("email")
            })

        return results
