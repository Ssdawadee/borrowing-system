from flask import Flask, request, jsonify

app = Flask(__name__)

equipments = [
{"id":1,"name":"Projector","category":"Audio Visual","quantity":3,"image_url":"https://upload.wikimedia.org/wikipedia/commons/3/3f/Video_projector.jpg"},
{"id":2,"name":"Projector Screen","category":"Audio Visual","quantity":2,"image_url":"https://upload.wikimedia.org/wikipedia/commons/8/8f/Projection_screen.jpg"},
{"id":3,"name":"Wireless Microphone","category":"Audio","quantity":5,"image_url":"https://upload.wikimedia.org/wikipedia/commons/6/6e/Wireless_microphone.jpg"},
{"id":4,"name":"Wired Microphone","category":"Audio","quantity":6,"image_url":"https://upload.wikimedia.org/wikipedia/commons/3/3f/Microphone.jpg"},
{"id":5,"name":"Portable Speaker","category":"Audio","quantity":4,"image_url":"https://upload.wikimedia.org/wikipedia/commons/4/4c/Portable_speaker.jpg"},
{"id":6,"name":"Audio Mixer","category":"Audio","quantity":2,"image_url":"https://upload.wikimedia.org/wikipedia/commons/6/6f/Audio_mixer.jpg"},
{"id":7,"name":"DSLR Camera","category":"Camera","quantity":2,"image_url":"https://upload.wikimedia.org/wikipedia/commons/9/9a/Canon_EOS_5D.jpg"},
{"id":8,"name":"Mirrorless Camera","category":"Camera","quantity":2,"image_url":"https://upload.wikimedia.org/wikipedia/commons/7/74/Mirrorless_camera.jpg"},
{"id":9,"name":"Tripod","category":"Camera","quantity":4,"image_url":"https://upload.wikimedia.org/wikipedia/commons/0/0c/Tripod.jpg"},
{"id":10,"name":"Ring Light","category":"Lighting","quantity":3,"image_url":"https://upload.wikimedia.org/wikipedia/commons/1/1b/Ring_light.jpg"},
{"id":11,"name":"Studio Light","category":"Lighting","quantity":3,"image_url":"https://upload.wikimedia.org/wikipedia/commons/4/44/Studio_light.jpg"},
{"id":12,"name":"Laptop","category":"Computer","quantity":3,"image_url":"https://upload.wikimedia.org/wikipedia/commons/3/3a/Laptop.jpg"},
{"id":13,"name":"Wireless Mouse","category":"Computer","quantity":6,"image_url":"https://upload.wikimedia.org/wikipedia/commons/2/2c/Wireless_mouse.jpg"},
{"id":14,"name":"Keyboard","category":"Computer","quantity":5,"image_url":"https://upload.wikimedia.org/wikipedia/commons/2/2c/Computer_keyboard.jpg"},
{"id":15,"name":"External Hard Drive","category":"Storage","quantity":3,"image_url":"https://upload.wikimedia.org/wikipedia/commons/5/5e/External_hard_drive.jpg"},
{"id":16,"name":"USB Flash Drive","category":"Storage","quantity":10,"image_url":"https://upload.wikimedia.org/wikipedia/commons/8/87/USB_flash_drive.jpg"},
{"id":17,"name":"HDMI Cable","category":"Cable","quantity":8,"image_url":"https://upload.wikimedia.org/wikipedia/commons/3/3f/HDMI_cable.jpg"},
{"id":18,"name":"LAN Cable","category":"Cable","quantity":10,"image_url":"https://upload.wikimedia.org/wikipedia/commons/6/6d/Ethernet_cable.jpg"},
{"id":19,"name":"Extension Power Strip","category":"Electrical","quantity":12,"image_url":"https://upload.wikimedia.org/wikipedia/commons/7/7f/Power_strip.jpg"},
{"id":20,"name":"Power Bank","category":"Electrical","quantity":5,"image_url":"https://upload.wikimedia.org/wikipedia/commons/e/e4/Power_bank.jpg"},
{"id":21,"name":"Tablet","category":"Computer","quantity":4,"image_url":"https://upload.wikimedia.org/wikipedia/commons/5/5f/Tablet_computer.jpg"},
{"id":22,"name":"Webcam","category":"Computer","quantity":5,"image_url":"https://upload.wikimedia.org/wikipedia/commons/3/30/Webcam.jpg"},
{"id":23,"name":"Headphones","category":"Audio","quantity":6,"image_url":"https://upload.wikimedia.org/wikipedia/commons/4/4f/Headphones.jpg"},
{"id":24,"name":"VR Headset","category":"Technology","quantity":2,"image_url":"https://upload.wikimedia.org/wikipedia/commons/2/2e/VR_headset.jpg"},
{"id":25,"name":"Digital Camera","category":"Camera","quantity":3,"image_url":"https://upload.wikimedia.org/wikipedia/commons/2/24/Digital_camera.jpg"},
{"id":26,"name":"Whiteboard","category":"Office","quantity":3,"image_url":"https://upload.wikimedia.org/wikipedia/commons/1/1a/Whiteboard.jpg"},
{"id":27,"name":"Laser Pointer","category":"Presentation","quantity":5,"image_url":"https://upload.wikimedia.org/wikipedia/commons/0/05/Laser_pointer.jpg"},
{"id":28,"name":"Micro SD Card","category":"Storage","quantity":10,"image_url":"https://upload.wikimedia.org/wikipedia/commons/7/71/MicroSD_card.jpg"},
{"id":29,"name":"Monitor","category":"Computer","quantity":4,"image_url":"https://upload.wikimedia.org/wikipedia/commons/6/65/Computer_monitor.jpg"},
{"id":30,"name":"Printer","category":"Office","quantity":2,"image_url":"https://upload.wikimedia.org/wikipedia/commons/3/3f/Printer.jpg"}
]

borrow_requests = []

@app.route('/equipments', methods=['GET'])
def get_all_equipments():
    return jsonify({"equipments": equipments})

@app.route('/borrow', methods=['POST'])
def borrow_equipment():
    data = request.get_json()
    equip = next((e for e in equipments if e["id"] == data["equipment_id"]), None)

    if equip and equip["quantity"] > 0:
        equip["quantity"] -= 1

        borrow = {
            "id": len(borrow_requests) + 1,
            "equipment_id": data["equipment_id"],
            "user": data["user"],
            "status": "borrowed"
        }

        borrow_requests.append(borrow)

        return jsonify(borrow)

    return jsonify({"error": "Equipment not available"}), 400

@app.route('/return/<int:borrow_id>', methods=['PUT'])
def return_equipment(borrow_id):

    borrow = next((b for b in borrow_requests if b["id"] == borrow_id), None)

    if borrow:
        equip = next((e for e in equipments if e["id"] == borrow["equipment_id"]), None)

        if equip:
            equip["quantity"] += 1

        borrow["status"] = "returned"

        return jsonify(borrow)

    return jsonify({"error": "Borrow record not found"}), 404

@app.route('/borrow', methods=['GET'])
def get_borrow_list():
    return jsonify({"borrow_requests": borrow_requests})

if __name__ == '__main__':
    app.run(debug=True)