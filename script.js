const firstName = document.getElementById("fname");
const lastName = document.getElementById("lname");
const birthday = document.getElementById("birth");
const note = document.getElementById("note");
const btn = document.getElementById("btn");


btn.addEventListener("click", (e) => {
    const field = [firstName, lastName, birthday, note];
    let formValidation = true;

    field.forEach((input) => {
        if (!input)
            return;

        input.setCustomValidity("");
        if (!input.value.trim()) {
            input.setCustomValidity(
                input === birthday
                    ? "please enter your birthday"
                    : "this field is required to submit"
            );
            formValidation = false;
        }
    });
    if (!formValidation) {
        e.preventDefault();
        const invalidField = field.find(
            (input) => input && !input.value.trim()
        );
        invalidField?.focus();
        invalidField?.reportValidity();
        return;
    }

    e.preventDefault();
    saveForm();
    Profile();
});

function saveForm() {
    localStorage.setItem(
        "registration",
        JSON.stringify({
            firstName: firstName.value.trim(),
            lastName: lastName.value.trim(),
            birthday: birthday.value,
            note: note.value.trim(),
        })
    );
}

async function Profile() {
    try {
        const res = await fetch("https://randomuser.me/api/");
        if (!res.ok) {
            throw new Error("can't get the response");
        }

        const getting_data = await res.json();
        const user = getting_data.results[0];
        let profile = document.getElementById("generated-profile");

        if (!profile) {
            profile = document.createElement("section");
            profile.id = "generated-profile";
            btn.insertAdjacentElement("afterend", profile);
        }

        profile.replaceChildren();

        const heading = document.createElement("h2");
        heading.textContent = "Generated Profile";
        profile.append(heading);

        const image = document.createElement("img");
        image.src = user.picture.large;
        image.alt = user.name.first + " " + user.name.last;
        profile.append(image);

        const email = document.createElement("p");
        email.textContent = "Email: " + user.email;
        profile.append(email);

        const phone = document.createElement("p");
        phone.textContent = "Phone: " + user.phone;
        profile.append(phone);

        const country = document.createElement("p");
        country.textContent = "Country: " + user.location.country;
        profile.append(country);

        const city = document.createElement("p");
        city.textContent = "City: " + user.location.city;
        profile.append(city);

        const apiError = await fetch("https://randomuser.me/api/invalid");
        if (!apiError.ok) {
            throw new Error(
                `Profile API failed with HTTP status ${apiError.status}`
            );
        }
    } catch (error) {
        console.error(error);

        let errorMsg = document.getElementById("profile-error");
        if (!errorMsg) {
            errorMsg = document.createElement("p");
            errorMsg.id = "profile-error";
            btn.insertAdjacentElement("afterend", errorMsg);
        }
        errorMsg.textContent = error.message;
    }
}