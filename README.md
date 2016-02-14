# Client Entities and Client/Server Publications/Methods

Creates Entity objects on the client and Client/Server wrappers for Publications and Methods.

## Current State
- Currently only a client side implementation of fields and content.
- Method and Publication mapping is server side and client side.
- No security on save
- Tests are light/incomplete

## TODO 
- **Implement save security** - very high priority
- Implement tests
- Add child behavior
- Create server side implementation of database mapping

## Why?
I had a need for another project to do some really heavy data lifting with validation and fine grained dependencies.
I realized that if I had that need other people probably do as well.  There are other packages that do similar things,
and those are great packages, so this is not me saying don't use them.  In general they either didn't
quite meet my use case, or they weren't public and widely used before I started work on the original version of this.

This is a complete rewrite from scratch of the entity code I wrote for that project which had some more specific use cases.  
That project also was written to depend heavily on decorators, and while I think decorators are a great way of providing
mixin behavior to ES6 classes, I wanted to write this in such a way as to be usable out of the box with Meteor as is
right now instead of requiring some other compiler (such as an outdated babel compiler).

The version I wrote for that project has full entity behavior server and client, as well as heirarchy of entities.  It
is capable, with the right publication code to expose a full graph of normalized or denormalized entity objects.  This
one currently can only do flat objects or objects which are denormalized in advance.  (It doesn't handle child entities).

For various reasons, I don't have the permission to just open source that code, but I felt that this was a valuable tool
and I want to share it, so I am recreating it.

### License

Released under MIT License.