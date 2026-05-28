const socket =
  io("http://localhost:3001");

let currentUser = "";
let chattingWith = "";

async function createUser() {

  const res =
    await fetch(
      "/create-user",
      {
        method: "POST"
      }
    );

  const data =
    await res.json();

  currentUser =
    data.username;

  document.getElementById(
    "me"
  ).innerText =
    "Tu: " + currentUser;
}

createUser();

async function searchUser() {

  const value =
    document.getElementById(
      "search"
    ).value;

  const res =
    await fetch(
      "/search/" + value
    );

  const users =
    await res.json();

  const div =
    document.getElementById(
      "users"
    );

  div.innerHTML = "";

  users.forEach(user => {

    if (
      user.username !== currentUser
    ) {

      div.innerHTML += `
        <button
          onclick="
            openChat('${user.username}')
          "
        >
          ${user.username}
        </button>
      `;
    }
  });
}

async function openChat(user) {

  chattingWith = user;

  const res =
    await fetch(
      `/messages/${currentUser}/${user}`
    );

  const messages =
    await res.json();

  const div =
    document.getElementById(
      "messages"
    );

  div.innerHTML = "";

  messages.forEach(m => {

    div.innerHTML += `
      <p>
        <b>${m.from}</b>:
        ${m.text}
      </p>
    `;
  });
}

function sendMessage() {

  if (!chattingWith) {

    alert(
      "Seleziona un utente"
    );

    return;
  }

  const input =
    document.getElementById(
      "message"
    );

  socket.emit("send_message", {

    from: currentUser,
    to: chattingWith,
    text: input.value
  });

  input.value = "";
}

socket.on("receive_message", data => {

  if (

    data.from === chattingWith ||

    data.to === chattingWith
  ) {

    const div =
      document.getElementById(
        "messages"
      );

    div.innerHTML += `
      <p>
        <b>${data.from}</b>:
        ${data.text}
      </p>
    `;
  }
});
