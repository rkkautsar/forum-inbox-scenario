import { useCallback, useEffect, useMemo, useState } from "react";
import type { Api, FeatureModule, Post } from "./feature-types.ts";

const modules = import.meta.glob<FeatureModule>("./features/*.tsx", {
  eager: true,
});

export function App() {
  const [user, setUser] = useState("maya");
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [features, setFeatures] = useState<string[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [status, setStatus] = useState("");
  const [composing, setComposing] = useState(false);
  const [expandedPosts, setExpandedPosts] = useState<Set<number>>(
    () => new Set(),
  );
  const [query, setQuery] = useState("");
  const [revision, setRevision] = useState(0);
  const featureModules = useMemo(
    () =>
      Object.entries(modules).map(([path, module]) => ({
        id: path.split("/").at(-1)!.replace(".tsx", ""),
        module,
      })),
    [],
  );
  const activeFeatures = featureModules.filter(({ id }) =>
    features.includes(id),
  );
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  const api = useCallback<Api>(
    async (path, options = {}) => {
      const response = await fetch(path, {
        ...options,
        headers: {
          "content-type": "application/json",
          "x-demo-user": user,
          ...options.headers,
        },
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error);
      return data;
    },
    [user],
  );

  useEffect(() => {
    let active = true;
    api("/api/users")
      .then((items) => {
        if (active) setUsers(items);
      })
      .catch((error) => {
        if (active) setStatus(error.message);
      });
    api("/api/features")
      .then((items) => {
        if (active) setFeatures(items.map((item: { id: string }) => item.id));
      })
      .catch((error) => {
        if (active) setStatus(error.message);
      });
    return () => {
      active = false;
    };
  }, [api]);
  useEffect(() => {
    let active = true;
    api("/api/posts?" + query)
      .then((items) => {
        if (active) setPosts(items);
      })
      .catch((error) => {
        if (active) setStatus(error.message);
      });
    return () => {
      active = false;
    };
  }, [api, revision, query]);

  const run = async (action: () => Promise<unknown>) => {
    try {
      setStatus("");
      await action();
      refresh();
    } catch (error) {
      setStatus((error as Error).message);
    }
  };

  return (
    <>
      <header>
        <a href="/" className="brand">
          forum<span> / the community</span>
        </a>
        <label>
          Browsing as{" "}
          <select
            aria-label="Demo identity"
            value={user}
            onChange={(event) => setUser(event.target.value)}
          >
            {users.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>
      </header>
      <div className="layout">
        <main>
          <div className="intro">
            <div>
              <p className="eyebrow">A PLACE TO CATCH UP</p>
              <h1>
                Good conversations
                <br />
                deserve a home.
              </h1>
            </div>
            <button onClick={() => setComposing((value) => !value)}>
              Start a thread
            </button>
          </div>
          <p id="status" role="status">
            {status}
          </p>
          <section id="tools" aria-label="Feed tools">
            {activeFeatures.map(({ id, module }) => {
              const Toolbar = module.Toolbar;
              return (
                Toolbar && (
                  <Toolbar
                    key={id}
                    api={api}
                    refresh={refresh}
                    user={user}
                    query={query}
                    setQuery={setQuery}
                  />
                )
              );
            })}
          </section>
          {composing && (
            <form
              id="new-post"
              onSubmit={(event) => {
                event.preventDefault();
                const form = event.currentTarget;
                const data = new FormData(form);
                void run(async () => {
                  await api("/api/posts", {
                    method: "POST",
                    body: JSON.stringify(Object.fromEntries(data)),
                  });
                  form.reset();
                  setComposing(false);
                });
              }}
            >
              <label>
                Title
                <input name="title" required maxLength={160} />
              </label>
              <label>
                What is on your mind?
                <textarea name="body" required maxLength={5000} />
              </label>
              <button>Post thread</button>
            </form>
          )}
          <section id="feed" aria-label="Threads">
            {posts.length === 0 &&
              (activeFeatures.find(({ module }) => module.EmptyState)?.module
                .EmptyState ? (
                (() => {
                  const EmptyState = activeFeatures.find(
                    ({ module }) => module.EmptyState,
                  )!.module.EmptyState!;
                  return <EmptyState query={query} />;
                })()
              ) : (
                <p className="empty">No threads found.</p>
              ))}
            {posts.map((post) => (
              <article className="thread" data-post-id={post.id} key={post.id}>
                <div className="meta">
                  <span className="avatar">{post.author[0]}</span>
                  {post.author} · community member
                </div>
                <h2>{post.title}</h2>
                {(() => {
                  const bodyFeature = activeFeatures.find(
                    ({ module }) => module.PostBody,
                  );
                  const PostBody = bodyFeature?.module.PostBody;
                  return PostBody ? (
                    <PostBody
                      api={api}
                      refresh={refresh}
                      user={user}
                      post={post}
                    />
                  ) : (
                    <p className="body">{post.preview}</p>
                  );
                })()}
                <div className="actions">
                  <button
                    aria-expanded={expandedPosts.has(post.id)}
                    onClick={() => {
                      setExpandedPosts((current) => {
                        const next = new Set(current);
                        if (next.has(post.id)) next.delete(post.id);
                        else next.add(post.id);
                        return next;
                      });
                    }}
                  >
                    {post.comments.length} comments
                  </button>
                  {activeFeatures.map(({ id, module }) => {
                    const PostAction = module.PostAction;
                    return (
                      PostAction && (
                        <PostAction
                          key={id}
                          api={api}
                          refresh={refresh}
                          user={user}
                          post={post}
                        />
                      )
                    );
                  })}
                </div>
                <div className="comments" hidden={!expandedPosts.has(post.id)}>
                  {post.comments.map((comment) => (
                    <div
                      className="comment"
                      data-comment-id={comment.id}
                      data-author-id={comment.authorId}
                      key={comment.id}
                    >
                      <strong>
                        {comment.author}
                        {comment.editedAt ? " · edited" : ""}
                      </strong>
                      <p>{comment.body}</p>
                      {activeFeatures.map(({ id, module }) => {
                        const CommentAction = module.CommentAction;
                        return (
                          CommentAction && (
                            <CommentAction
                              key={id}
                              api={api}
                              refresh={refresh}
                              user={user}
                              post={post}
                              comment={comment}
                            />
                          )
                        );
                      })}
                    </div>
                  ))}
                  <form
                    className="reply"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const form = event.currentTarget;
                      const body = new FormData(form).get("body");
                      void run(async () => {
                        await api(`/api/posts/${post.id}/comments`, {
                          method: "POST",
                          body: JSON.stringify({ body }),
                        });
                        form.reset();
                      });
                    }}
                  >
                    <input
                      name="body"
                      placeholder="Add something to the conversation"
                      required
                      maxLength={2000}
                    />
                    <button>Reply</button>
                  </form>
                </div>
              </article>
            ))}
          </section>
          {activeFeatures.map(({ id, module }) => {
            const Pagination = module.Pagination;
            return (
              Pagination && (
                <Pagination
                  key={id}
                  posts={posts}
                  api={api}
                  query={query}
                  setQuery={setQuery}
                />
              )
            );
          })}
        </main>
        <aside>
          <p className="eyebrow">WELCOME IN</p>
          <h2>
            Your corner
            <br />
            of the internet.
          </h2>
          <p>
            A few familiar faces, thoughtful questions, and room for a tangent.
          </p>
          <hr />
          <h3>Keep it useful.</h3>
          <p>
            Be curious. Explain your thinking. Remember there is a person on the
            other side.
          </p>
          <div className="note">
            The community is growing. Follow the Game Master issue in GitHub to
            help decide what ships next.
          </div>
          <p className="fine">Local training app · demo identities</p>
        </aside>
      </div>
    </>
  );
}
