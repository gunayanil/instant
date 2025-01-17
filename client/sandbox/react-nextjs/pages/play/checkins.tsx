import { i, id, init_experimental } from "@instantdb/react";
import config from "../../config";

interface Data {
  notes: string;
}

const schema = i
  .graph(
    "",
    {
      habits: i.entity({
        name: i.string(),
      }),
      checkins: i.entity({
        date: i.string(),
        data: i.json<Data>().optional(),
        meta: i.any().optional(),
      }),
      categories: i.entity({
        name: i.string(),
      }),
    },
    {
      habitCheckins: {
        forward: {
          on: "habits",
          has: "many",
          label: "checkins",
        },
        reverse: {
          on: "checkins",
          has: "one",
          label: "habit",
        },
      },
      habitCategory: {
        forward: {
          on: "habits",
          has: "one",
          label: "category",
        },
        reverse: {
          on: "categories",
          has: "many",
          label: "habits",
        },
      },
    },
  )
  .withRoomSchema<{
    demo: {
      presence: {
        test: number;
      };
    };
  }>();

const db = init_experimental({
  ...config,
  schema,
});

export default function Main() {
  db.room("demo", "demo").useSyncPresence({
    test: Date.now(),
  });

  const { isLoading, error, data } = db.useQuery({
    checkins: {
      habit: {
        category: {},
      },
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <ul>
        {data.checkins.map((c) => (
          <li key={c.id}>
            {c.date} - {c.habit?.name} ({c.habit?.category?.name})
          </li>
        ))}
      </ul>
    </div>
  );
}

if (typeof window !== "undefined") {
  (window as any)._create = () => {
    const habitId = id();
    const checkinId = id();
    db.transact([
      db.tx.habits[habitId].update({
        name: "Habit " + Math.random().toString().slice(2),
      }),
      db.tx.checkins[checkinId].update({
        date: Date.now().toString(),
        data: { notes: "" },
        meta: null,
      }),
      db.tx.habits[habitId].link({
        checkins: [checkinId],
      }),
    ]);
  };
}
